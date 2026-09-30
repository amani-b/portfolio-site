/*
 * Render audit for portfolio-architect.
 *
 * Loads the site headlessly at six viewport widths and reports the classes of
 * defect that are invisible in source review: horizontal overflow, sub-44px tap
 * targets, missing accessible names, broken heading order, images without alt
 * text, duplicate ids, and any console/runtime error.
 *
 * It also drives the two interactive components — the case-study disclosure and
 * the screenshot viewer — because "it renders" is not the same as "it works".
 *
 * Usage:  npm run dev        (in one shell)
 *         npm run audit      (in another)
 *         node scripts/audit.cjs http://localhost:3000
 *
 * Drives a locally installed Chrome or Edge via puppeteer-core; no browser
 * download, no extra system dependency.
 */
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("puppeteer-core");

const CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "screenshots", "audit");

const VIEWPORTS = [
  { name: "xs-320", width: 320, height: 640, dpr: 2, mobile: true },
  { name: "sm-375", width: 375, height: 812, dpr: 3, mobile: true },
  { name: "md-430", width: 430, height: 932, dpr: 3, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, dpr: 2, mobile: false },
  { name: "laptop-1024", width: 1024, height: 768, dpr: 2, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, dpr: 2, mobile: false },
];

const problems = [];
const notes = [];

function fail(where, message) {
  problems.push(`[${where}] ${message}`);
}

/* Runs in the page. Kept as a string-free function so it is lint-checkable. */
function collect() {
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string" && el.className
        ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}`
        : "";
    const text = (el.textContent || "").trim().slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ""}`;
  };

  const accessibleName = (el) => {
    const aria = el.getAttribute("aria-label");
    if (aria && aria.trim()) return aria.trim();
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const target = document.getElementById(labelledBy);
      if (target && target.textContent.trim()) return target.textContent.trim();
    }
    const title = el.getAttribute("title");
    if (title && title.trim()) return title.trim();
    const img = el.querySelector("img[alt]");
    if (img && img.getAttribute("alt").trim()) return img.getAttribute("alt").trim();
    return (el.textContent || "").trim();
  };

  const out = {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflowing: [],
    targets: [],
    unnamed: [],
    emptyAlt: [],
    headings: [],
    duplicateIds: [],
    tinyText: [],
    unrevealed: [],
  };

  /* Elements that stick out past the right edge of the viewport. */
  for (const el of document.querySelectorAll("body *")) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right > window.innerWidth + 1 || rect.left < -1) {
      out.overflowing.push({
        el: describe(el),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
    }
  }

  /* Interactive elements, their hit area and their accessible name. */
  const interactive = document.querySelectorAll(
    'a[href], button, summary, [role="button"], input, select, textarea',
  );
  for (const el of interactive) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    /* Visually-hidden-until-focused affordances (the skip link) are 1x1 by
       design; they get their real size when focused. */
    if (el.classList.contains("sr-only")) continue;

    const inlineInProse =
      style.display === "inline" && !!el.closest("p, li, dd, figcaption");
    if (!inlineInProse) {
      out.targets.push({
        el: describe(el),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      });
    }

    if (!accessibleName(el)) out.unnamed.push(describe(el));
  }

  for (const img of document.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) out.emptyAlt.push(`${describe(img)} has no alt attribute`);
    else if (!img.getAttribute("alt").trim() && !img.closest('[aria-hidden="true"]')) {
      out.emptyAlt.push(`${describe(img)} has an empty alt but is not aria-hidden`);
    }
  }

  const levels = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };
  for (const h of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    out.headings.push({ level: levels[h.tagName.toLowerCase()], text: h.textContent.trim().slice(0, 60) });
  }

  const seen = new Map();
  for (const el of document.querySelectorAll("[id]")) {
    seen.set(el.id, (seen.get(el.id) || 0) + 1);
  }
  for (const [id, count] of seen) if (count > 1) out.duplicateIds.push(`${id} ×${count}`);

  /* Text below 12px is hard to read regardless of contrast. */
  for (const el of document.querySelectorAll("body *")) {
    if (!el.childNodes.length) continue;
    const hasText = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
    );
    if (!hasText) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 12) out.tinyText.push(`${describe(el)} @ ${size}px`);
  }

  /*
   * Scroll-entrance elements must have actually arrived. A reveal that never
   * fires leaves a blank page — invisible to every other check here, because the
   * element is present, laid out, and has no missing alt text.
   */
  for (const el of document.querySelectorAll(".reveal")) {
    const opacity = parseFloat(getComputedStyle(el).opacity);
    if (opacity < 0.9) {
      out.unrevealed.push(
        `${describe(el)} still at opacity ${opacity} after scrolling through the page`,
      );
    }
  }

  return out;
}

/* Scroll the whole document so lazy images and scroll-entrance reveals fire.
   `behavior: "instant"` is required: the page sets `scroll-behavior: smooth`,
   which would otherwise let each programmatic scroll be interrupted by the next
   one, so the viewport never actually reaches the lower sections and their
   reveal observers never fire.

   The awaits inside the loop are the point — each scroll has to be given a
   frame to paint and let its observers run before the next one lands, so this
   is sequential by design rather than an accidental waterfall. */
/* oxlint-disable no-await-in-loop */
async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.75;
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 600));
  });
}
/* oxlint-enable no-await-in-loop */

(async () => {
  const executablePath = CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!executablePath) {
    console.error("No Chrome/Edge binary found. Checked:\n" + CANDIDATES.join("\n"));
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });

  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
      });

      const response = await page.goto(BASE, { waitUntil: "networkidle0", timeout: 45000 });
      const status = response ? response.status() : 0;
      /* 304 is a cache hit, not a failure. */
      if (!response || (status >= 400 && status !== 304)) {
        fail(vp.name, `HTTP ${status || "no response"} from ${BASE}`);
        await page.close();
        continue;
      }

      await settle(page);
      const data = await page.evaluate(collect);

      /* ————— horizontal overflow ————— */
      if (data.scrollWidth > data.clientWidth + 1) {
        fail(vp.name, `horizontal overflow: scrollWidth ${data.scrollWidth} > ${data.clientWidth}`);
      }
      if (data.overflowing.length) {
        for (const item of data.overflowing.slice(0, 6)) {
          fail(vp.name, `overflows viewport (${item.left}…${item.right}px): ${item.el}`);
        }
      }

      /* ————— touch targets —————
         44px is the practical touch bar (WCAG 2.5.5 / Apple HIG); 24px is the
         WCAG 2.5.8 AA minimum that applies to pointer input generally. */
      const minTarget = vp.mobile ? 44 : 24;
      const small = data.targets.filter((t) => t.w < minTarget || t.h < minTarget);
      for (const item of small.slice(0, 8)) {
        fail(
          vp.name,
          `target ${item.w}×${item.h} (<${minTarget}px): ${item.el}`,
        );
      }

      /* ————— accessible names ————— */
      for (const item of data.unnamed.slice(0, 8)) {
        fail(vp.name, `interactive element with no accessible name: ${item}`);
      }

      /* ————— alt text ————— */
      for (const item of data.emptyAlt.slice(0, 8)) fail(vp.name, item);

      /* ————— heading order ————— */
      const h1s = data.headings.filter((h) => h.level === 1);
      if (h1s.length !== 1) fail(vp.name, `expected exactly one <h1>, found ${h1s.length}`);
      for (let i = 1; i < data.headings.length; i++) {
        const prev = data.headings[i - 1];
        const curr = data.headings[i];
        if (curr.level > prev.level + 1) {
          fail(vp.name, `heading level skips h${prev.level} → h${curr.level} at "${curr.text}"`);
        }
      }

      /* ————— ids ————— */
      for (const item of data.duplicateIds) fail(vp.name, `duplicate id: ${item}`);

      /* ————— scroll entrances actually arrived ————— */
      for (const item of data.unrevealed) fail(vp.name, item);

      /* ————— text size ————— */
      for (const item of data.tinyText.slice(0, 5)) {
        notes.push(`[${vp.name}] text under 12px: ${item}`);
      }

      for (const item of consoleErrors) fail(vp.name, `console: ${item}`);

      await page.screenshot({ path: path.join(OUT, `${vp.name}.png`), fullPage: true });
      notes.push(
        `[${vp.name}] ok — ${data.headings.length} headings, ${data.overflowing.length} overflow, ${small.length} targets under ${minTarget}px`,
      );
      await page.close();
    }

    /* ————————————————————————————————————————————————————————————
     * Interaction: the case-study disclosure and the screenshot viewer.
     * ———————————————————————————————————————————————————————————— */
    const page = await browser.newPage();
    const interactionErrors = [];
    page.on("pageerror", (err) => interactionErrors.push(err.message));
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE, { waitUntil: "networkidle0", timeout: 45000 });
    await settle(page);

    /* ————— case-study disclosure ————— */
    const toggle = await page.$('button[aria-controls="case-study-cafeerp"]');
    if (!toggle) {
      fail("interaction", "case-study disclosure button not found");
    } else {
      const before = await page.evaluate(() => {
        const panel = document.getElementById("case-study-cafeerp");
        return {
          expanded: document
            .querySelector('button[aria-controls="case-study-cafeerp"]')
            .getAttribute("aria-expanded"),
          height: panel.getBoundingClientRect().height,
          inert: panel.hasAttribute("inert"),
        };
      });
      if (before.expanded !== "false") fail("interaction", `disclosure starts aria-expanded=${before.expanded}, expected false`);
      if (before.height > 2) fail("interaction", `collapsed panel has height ${before.height}px, expected ~0`);
      if (!before.inert) fail("interaction", "collapsed panel is not inert, so its prose stays in the accessibility tree");

      await toggle.click();
      await new Promise((r) => setTimeout(r, 600));
      const after = await page.evaluate(() => {
        const panel = document.getElementById("case-study-cafeerp");
        const sections = panel.querySelectorAll("section");
        return {
          expanded: document
            .querySelector('button[aria-controls="case-study-cafeerp"]')
            .getAttribute("aria-expanded"),
          height: Math.round(panel.getBoundingClientRect().height),
          inert: panel.hasAttribute("inert"),
          sections: sections.length,
          focusable: panel.querySelectorAll("a[href], button").length,
        };
      });
      if (after.expanded !== "true") fail("interaction", "disclosure did not report aria-expanded=true after click");
      if (after.height < 400) fail("interaction", `expanded panel is only ${after.height}px tall — content may not be rendering`);
      if (after.inert) fail("interaction", "expanded panel is still inert");
      if (after.sections !== 5) fail("interaction", `expected 5 case-study sections, found ${after.sections}`);
      notes.push(
        `[interaction] disclosure: ${before.height}px → ${after.height}px, ${after.sections} sections, ${after.focusable} focusable`,
      );

      /* The "What I'd Do Differently" retrospective must be present and marked. */
      const hasRetro = await page.evaluate(() =>
        Array.from(document.querySelectorAll("#case-study-cafeerp h4")).some((h) =>
          h.textContent.includes("What I'd Do Differently"),
        ),
      );
      if (!hasRetro) fail("interaction", "retrospective section missing from the case study");

      await page.screenshot({ path: path.join(OUT, "case-study-open.png"), fullPage: false });
    }

    /* ————— screenshot viewer ————— */
    await page.evaluate(() => window.scrollTo(0, 0));
    const thumb = await page.evaluateHandle(() => {
      const img = document.querySelector('img[src*="cafeerp-1.png"]');
      return img ? img.closest("button") : null;
    });
    const thumbEl = thumb.asElement();
    if (!thumbEl) {
      fail("interaction", "screenshot thumbnail button not found");
    } else {
      await thumbEl.click();
      await new Promise((r) => setTimeout(r, 400));
      const opened = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        return {
          open: !!dialog,
          locked: getComputedStyle(document.body).overflow === "hidden",
          focused: document.activeElement === dialog,
          label: dialog ? dialog.getAttribute("aria-label") : null,
        };
      });
      if (!opened.open) fail("interaction", "screenshot viewer did not open");
      if (!opened.locked) fail("interaction", "body scroll was not locked behind the viewer");
      if (!opened.focused) fail("interaction", "focus did not move to the viewer dialog");
      notes.push(`[interaction] viewer opened, label="${opened.label}", focus+scroll-lock ok`);

      /*
       * `aria-modal="true"` is a claim, not an enforcement. The page behind the
       * viewer has to actually be inert, or Tab walks straight out of the
       * dialog and into the nav — which is exactly what it did before.
       */
      const modal = await page.evaluate(() => {
        const root = document.getElementById("root");
        const probe = root.querySelector('a[href="#projects"]');
        probe.focus();
        return {
          rootInert: root.hasAttribute("inert"),
          backgroundFocusable: document.activeElement === probe,
        };
      });
      if (!modal.rootInert) {
        fail("interaction", "#root is not inert while the viewer is open — aria-modal is asserted but not enforced");
      }
      if (modal.backgroundFocusable) {
        fail("interaction", "background links are still focusable behind the viewer");
      }

      await page.keyboard.press("Tab");
      const tabStayed = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        return !!dialog && dialog.contains(document.activeElement);
      });
      if (!tabStayed) fail("interaction", "Tab escaped the viewer dialog");
      notes.push(`[interaction] modal containment: #root inert=${modal.rootInert}, Tab stayed inside=${tabStayed}`);

      await page.screenshot({ path: path.join(OUT, "viewer-open.png") });

      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 400));
      const closed = await page.evaluate(() => ({
        open: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
        restored: document.activeElement
          ? document.activeElement.tagName.toLowerCase()
          : null,
        unlocked: getComputedStyle(document.body).overflow !== "hidden",
        rootInert: document.getElementById("root").hasAttribute("inert"),
      }));
      if (closed.open) fail("interaction", "Escape did not close the viewer");
      if (!closed.unlocked) fail("interaction", "body scroll was not restored after closing the viewer");
      if (closed.rootInert) fail("interaction", "#root stayed inert after the viewer closed");
      notes.push(`[interaction] viewer closed on Escape, focus restored to <${closed.restored}>, inert removed`);
    }

    /* ————— reduced motion: content must still be visible ————— */
    const rmPage = await browser.newPage();
    await rmPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await rmPage.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await rmPage.goto(BASE, { waitUntil: "networkidle0", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 500));
    const rm = await rmPage.evaluate(() => {
      const hidden = [];
      for (const el of document.querySelectorAll("h1, h2, h3, section p")) {
        const style = getComputedStyle(el);
        if (parseFloat(style.opacity) < 0.9) hidden.push(el.tagName + " " + el.textContent.trim().slice(0, 40));
      }
      return {
        hidden,
        h1: document.querySelector("h1")?.textContent.trim().slice(0, 60) ?? null,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    if (rm.hidden.length) {
      fail("reduced-motion", `content left invisible: ${rm.hidden.slice(0, 5).join(" | ")}`);
    }
    if (rm.scrollBehavior !== "auto") {
      fail("reduced-motion", `smooth scrolling still on (scroll-behavior: ${rm.scrollBehavior})`);
    }
    notes.push(`[reduced-motion] no hidden content; scroll-behavior: ${rm.scrollBehavior}; h1="${rm.h1}"`);
    await rmPage.close();

    for (const err of interactionErrors) fail("interaction", `pageerror: ${err}`);
    await page.close();
  } finally {
    await browser.close();
  }

  console.log("\n=== NOTES ===");
  for (const n of notes) console.log("  " + n);
  console.log("\n=== PROBLEMS ===");
  if (!problems.length) console.log("  none — clean");
  else for (const p of problems) console.log("  ✗ " + p);
  console.log(`\n${problems.length} problem(s). Screenshots in screenshots/audit/.`);
  process.exit(problems.length ? 1 : 0);
})().catch((err) => {
  console.error("audit failed:", err);
  process.exit(2);
});
