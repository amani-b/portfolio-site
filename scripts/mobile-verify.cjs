/* Final verification: phone captures, a real swipe, and a desktop regression check. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require("puppeteer-core");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:3000";
const PHONE = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, viewport, theme) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
  return page;
}

/** Touch drag via CDP so real pointer events (not synthetic clicks) drive the deck. */
async function swipe(page, selector, dx) {
  const box = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, selector);
  const client = await page.createCDPSession();
  const steps = 12;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x, y: box.y }],
  });
  for (let i = 1; i <= steps; i++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + (dx * i) / steps, y: box.y }],
    });
    await wait(14);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: "new",
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  const findings = [];

  /* ————— 1. Deck swipe: does a real touch drag flip the pile? ————— */
  {
    const page = await newPage(browser, PHONE, "light");
    await page.goto(`${BASE}/projects/cafeerp`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      const d = document.querySelector(".deck");
      window.scrollTo(0, d.getBoundingClientRect().top + window.scrollY - 120);
    });
    await wait(500);

    const counter = () => page.$eval('[aria-label^="Screenshot"] + p, .md\\:hidden p[aria-live]', () => null).catch(() => null);
    void counter;

    const readIndex = () =>
      page.evaluate(() => {
        const el = document.querySelector(".deck + div + p, .md\\:hidden > p");
        const label = document.querySelector('[aria-roledescription="carousel"]').getAttribute("aria-label");
        return label;
      });

    const before = await readIndex();
    await swipe(page, ".deck", -140);
    await wait(900);
    const after = await readIndex();
    await page.screenshot({ path: "screenshots/p-deck-swiped.png" });

    if (before === after) findings.push(`deck swipe did not advance (still "${after}")`);
    else findings.push(`deck swipe OK: "${before}" -> "${after}"`);

    // Drag left-to-right at the start should rubber-band, not wrap.
    await page.goto(`${BASE}/projects/cafeerp`, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      const d = document.querySelector(".deck");
      window.scrollTo(0, d.getBoundingClientRect().top + window.scrollY - 120);
    });
    await wait(400);
    await swipe(page, ".deck", 150);
    await wait(700);
    const wrapped = await readIndex();
    if (!wrapped.startsWith("Screenshot 1 of")) findings.push(`deck wrapped past the first card: "${wrapped}"`);
    else findings.push("deck rubber-bands at the first card (no wrap)");

    // Vertical drag must not be hijacked.
    const client = await page.createCDPSession();
    const box = await page.evaluate(() => {
      const r = document.querySelector(".deck").getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x, y: box.y }] });
    for (let i = 1; i <= 10; i++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: box.x, y: box.y - i * 14 }],
      });
      await wait(14);
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await client.detach();
    await wait(400);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    findings.push(`vertical drag on deck: page scroll ${scrollBefore} -> ${scrollAfter}`);
    await page.close();
  }

  /* ————— 2. Phone captures ————— */
  const shots = [
    ["light", "p-home", "/", null],
    ["light", "p-index", "/projects", null],
    ["light", "p-detail", "/projects/cafeerp", null],
    ["light", "p-detail-deck", "/projects/cafeerp", ".deck"],
    ["light", "p-detail-spec", "/projects/cafeerp", null, "open-spec"],
    ["light", "p-detail-mid", "/projects/cafeerp", ".case-study"],
    ["light", "p-about", "/about", null],
    ["dark", "p-dark-home", "/", null],
    ["dark", "p-dark-detail", "/projects/cafeerp", ".deck"],
    ["dark", "p-dark-index", "/projects", null],
  ];

  for (const [theme, name, path, scrollTo, action] of shots) {
    const page = await newPage(browser, PHONE, theme);
    await page.goto(BASE + path, { waitUntil: "networkidle0" });
    await wait(350);
    if (action === "open-spec") {
      await page.evaluate(() => {
        const d = document.querySelector("details");
        if (d) d.open = true;
      });
      await wait(300);
    }
    if (scrollTo) {
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
      }, scrollTo);
      await wait(450);
    }
    await page.screenshot({ path: `screenshots/${name}.png` });
    await page.close();
  }

  /* ————— 3. Viewer capture ————— */
  {
    const page = await newPage(browser, PHONE, "light");
    await page.goto(`${BASE}/projects/cafeerp`, { waitUntil: "networkidle0" });
    await wait(300);
    await page.click(".deck .deck-card button");
    await wait(700);
    await page.screenshot({ path: "screenshots/p-viewer.png" });
    await page.close();
  }

  /* ————— 4. Desktop regression: geometry of the original composition ————— */
  {
    const page = await newPage(browser, { width: 1440, height: 900 }, "light");
    const geometry = {};
    for (const [name, path] of [
      ["home", "/"],
      ["index", "/projects"],
      ["detail", "/projects/cafeerp"],
      ["about", "/about"],
    ]) {
      await page.goto(BASE + path, { waitUntil: "networkidle0" });
      await wait(300);
      geometry[name] = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        const header = document.querySelector("header");
        const nav = header.querySelector("nav");
        const main = document.querySelector("main");
        const rail = document.querySelector("aside");
        return {
          h1Size: getComputedStyle(h1).fontSize,
          h1Top: Math.round(h1.getBoundingClientRect().top),
          headerH: Math.round(header.getBoundingClientRect().height),
          navDisplay: getComputedStyle(nav).display,
          mainPadLeft: getComputedStyle(main.firstElementChild).paddingLeft,
          contentW: Math.round(main.firstElementChild.getBoundingClientRect().width),
          railVisible: rail ? getComputedStyle(rail).display !== "none" : "no-rail",
          railOrder: rail ? getComputedStyle(rail).order : "-",
          tabbar: !!document.querySelector("nav.tabbar") && getComputedStyle(document.querySelector("nav.tabbar")).display,
          bodyPadBottom: getComputedStyle(document.body).paddingBottom,
          deckVisible: (() => {
            const d = document.querySelector(".deck");
            return d ? getComputedStyle(d.parentElement).display : "no-deck";
          })(),
          trackVisible: (() => {
            const t = document.querySelector(".touch-pan-y");
            return t ? getComputedStyle(t.parentElement).display : "no-track";
          })(),
        };
      });
      await page.screenshot({ path: `screenshots/${name === "detail" ? "d-detail" : "d-" + name}.png` });
    }
    console.log("DESKTOP GEOMETRY:\n" + JSON.stringify(geometry, null, 2));
    await page.close();
  }

  console.log(findings.join("\n"));
  await browser.close();
})();
