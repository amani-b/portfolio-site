/* Mobile audit: layout integrity, overflow, tap targets, deck geometry and console health. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require("puppeteer-core");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:3000";

const DEVICES = [
  { name: "small", width: 320, height: 640, dpr: 2 },
  { name: "phone", width: 375, height: 812, dpr: 3 },
  { name: "phablet", width: 430, height: 932, dpr: 3 },
];

const PAGES = [
  { name: "home", path: "/" },
  { name: "index", path: "/projects" },
  { name: "detail", path: "/projects/cafeerp" },
  { name: "about", path: "/about" },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });

  const problems = [];
  const notes = [];

  for (const theme of ["light", "dark"]) {
    for (const device of DEVICES) {
      const page = await browser.newPage();
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.dpr,
        isMobile: true,
        hasTouch: true,
      });
      const messages = [];
      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning") messages.push(`${m.type()}: ${m.text()}`);
      });
      page.on("pageerror", (e) => messages.push(`pageerror: ${e.message}`));

      await page.evaluateOnNewDocument((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {
          /* ignore */
        }
      }, theme);

      for (const target of PAGES) {
        await page.goto(BASE + target.path, { waitUntil: "networkidle0" });
        await new Promise((r) => setTimeout(r, 350));

        const report = await page.evaluate(() => {
          const doc = document.documentElement;
          const overflow = doc.scrollWidth - doc.clientWidth;

          const wide = [];
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            if (r.right > window.innerWidth + 1.5 || r.left < -1.5) {
              wide.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || "").toString().slice(0, 60),
                left: Math.round(r.left),
                right: Math.round(r.right),
              });
            }
          }

          // Standalone controls only: true inline links inside prose are exempt.
          const small = [];
          for (const el of document.querySelectorAll("nav a, nav button, main button, main a[href], footer a[href]")) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (getComputedStyle(el).display === "inline") continue;
            if (r.height < 43.5) {
              small.push({
                tag: el.tagName.toLowerCase(),
                label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 34),
                h: Math.round(r.height),
              });
            }
          }

          const tabbar = document.querySelector("nav.tabbar");
          const tb = tabbar ? tabbar.getBoundingClientRect() : null;
          const activeTab = document.querySelector('nav.tabbar a[aria-current="page"]');

          return {
            overflow,
            wide: wide.slice(0, 5),
            small: small.slice(0, 8),
            tabbar: tb ? { top: Math.round(tb.top), bottom: Math.round(tb.bottom), height: Math.round(tb.height) } : null,
            activeTab: activeTab ? activeTab.textContent.trim() : null,
            bodyPadBottom: getComputedStyle(document.body).paddingBottom,
            viewportH: window.innerHeight,
            docHeight: doc.scrollHeight,
          };
        });

        const tag = `${theme}/${device.name}/${target.name}`;
        if (report.overflow > 1) problems.push(`${tag}: horizontal overflow ${report.overflow}px`);
        if (report.wide.length)
          problems.push(`${tag}: overflowing el — ${JSON.stringify(report.wide[0])}`);
        if (report.small.length) problems.push(`${tag}: small tap targets — ${JSON.stringify(report.small)}`);
        if (!report.tabbar) problems.push(`${tag}: NO bottom tab bar`);
        else if (report.tabbar.bottom > report.viewportH + 0.5)
          problems.push(`${tag}: tab bar off-screen (bottom ${report.tabbar.bottom} vs ${report.viewportH})`);
        if (!report.activeTab) problems.push(`${tag}: no active tab marked`);

        // The deck must actually read as a stack, not four cards on top of each other.
        if (target.name === "detail") {
          const deck = await page.evaluate(() => {
            const cards = [...document.querySelectorAll(".deck .deck-card")];
            return cards.map((c) => {
              const cs = getComputedStyle(c);
              return { transform: cs.transform, opacity: cs.opacity, z: cs.zIndex, pe: cs.pointerEvents };
            });
          });
          const unique = new Set(deck.map((d) => d.transform));
          if (deck.length < 2) problems.push(`${tag}: deck has ${deck.length} card(s)`);
          else if (unique.size < 2) problems.push(`${tag}: deck cards share one transform (no stack depth)`);
          const tapTargets = deck.filter((d) => d.pe === "auto").length;
          if (tapTargets !== 1) problems.push(`${tag}: ${tapTargets} deck cards are tappable (want 1)`);
          notes.push(`${tag}: deck ${deck.length} cards, ${unique.size} distinct poses, z=${deck.map((d) => d.z).join("/")}`);
        }

        if (theme === "light" && device.name === "phone") {
          await page.screenshot({
            path: `screenshots/m-${target.name}.png`,
            fullPage: target.name === "detail",
          });
        }
      }

      // Exercise the viewer on the detail page: open it, check the scrim, close it.
      if (device.name === "phone") {
        await page.goto(`${BASE}/projects/cafeerp`, { waitUntil: "networkidle0" });
        await page.click('.deck .deck-card[aria-hidden="false"] button, .deck .deck-card button');
        await new Promise((r) => setTimeout(r, 600));
        const dialog = await page.$('[role="dialog"]');
        if (!dialog) problems.push(`${theme}/${device.name}: viewer did not open`);
        else {
          const scrim = await page.evaluate(() => {
            const d = document.querySelector('[role="dialog"]');
            return {
              bg: getComputedStyle(d).backgroundColor,
              bodyOverflow: getComputedStyle(document.body).overflow,
              tabbarHidden: getComputedStyle(document.querySelector("nav.tabbar")).display,
            };
          });
          if (scrim.bodyOverflow !== "hidden") problems.push(`${theme}/${device.name}: page scroll not locked behind viewer`);
          if (scrim.tabbarHidden !== "none") problems.push(`${theme}/${device.name}: tab bar not hidden behind viewer`);
          notes.push(`${theme}/${device.name}: viewer scrim ${scrim.bg}`);
          if (theme === "light") await page.screenshot({ path: "screenshots/m-lightbox.png" });
          await page.keyboard.press("Escape");
          await new Promise((r) => setTimeout(r, 500));
          if (await page.$('[role="dialog"]')) problems.push(`${theme}/${device.name}: viewer did not close on Esc`);
        }
      }

      if (messages.length)
        problems.push(`${theme}/${device.name}: console — ${JSON.stringify([...new Set(messages)].slice(0, 4))}`);
      await page.close();
    }
  }

  console.log("———— NOTES ————");
  console.log(notes.join("\n"));
  console.log("\n———— PROBLEMS ————");
  console.log(problems.length ? problems.join("\n") : "none");
  await browser.close();
})();
