/*
 * Render audit for portfolio-site.
 *
 * Loads home and the detail document at six viewport widths and reports the
 * classes of defect that are invisible in source review: horizontal overflow,
 * sub-44px tap targets, missing accessible names, broken heading order,
 * images without alt text, duplicate ids, and any console/runtime error.
 *
 * It also drives the interactive components — the Featured/Index toggle, the
 * detail document, the screenshot viewer, routing (including the silent
 * redirect for dead URLs) and the theme switch — because "it renders" is not
 * the same as "it works".
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

/* Both documents are audited at every width. The detail page has its own
   heading tree, its own tap targets and the screenshot viewer, so passing on
   the home page says nothing about it. */
const ROUTES = [
  { label: "home", path: "/" },
  { label: "detail", path: "/projects/cafeerp" },
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
    unsized: [],
    headings: [],
    duplicateIds: [],
    tinyText: [],
    unrevealed: [],
    tables: [],
    staleAnchors: [],
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
    'a[href], button, summary, [role="button"], [role="switch"], input, select, textarea',
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

  /*
   * Every image must reserve its box. Without intrinsic dimensions the page
   * reflows as each screenshot arrives, and the failure is silent — the image
   * still renders. This is the DOM half of the rule the data model already
   * enforces (`ProjectImage` requires `width` and `height`); it catches a
   * component that forgets to pass them through, which is exactly the shape of
   * the bug that made this necessary.
   */
  for (const img of document.querySelectorAll("img")) {
    if (!img.getAttribute("width") || !img.getAttribute("height")) {
      out.unsized.push(`${describe(img)} has no intrinsic width/height`);
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

  /* Tables: the index page's contents list. A <table> that has lost its header
     cells, or whose rows are not headed by their subject, still renders. */
  for (const table of document.querySelectorAll("table")) {
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      th.textContent.trim(),
    );
    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    const caption = table.querySelector("caption");
    out.tables.push({
      columns: headers,
      rows: bodyRows.length,
      /* Rows whose first cell is a `th[scope=row]` — the subject of the row,
         which is what a screen reader announces before each cell. */
      rowHeaders: bodyRows.filter((tr) => tr.querySelector('th[scope="row"]')).length,
      caption: caption ? caption.textContent.trim() : "",
    });
  }

  /*
   * In-page anchors that point nowhere.
   *
   * The section holding the project entries was renamed `#projects` → `#work`,
   * and the hero's "View Work" button kept the old fragment. Nothing failed: an
   * `href` to a missing id is legal, silent, and does nothing at all when
   * clicked. A reader presses the button and the page just sits there.
   *
   * Every `#fragment` link is checked, not only the ones in prose. The first
   * draft of this check looked at `p a` and `li a` — and the button that
   * actually broke was in a `<div>`, so the check would have waved the real bug
   * straight through. A check that cannot fail on the bug it was written for is
   * decoration.
   *
   * `a[href^='#']` deliberately excludes `/#work`-style cross-route links: those
   * resolve against another route's DOM, which this page cannot see, and the
   * router's own assertions cover them.
   */
  for (const link of document.querySelectorAll("a[href^='#']")) {
    const fragment = link.getAttribute("href");
    if (fragment === "#") continue;
    if (!document.querySelector(`[id="${CSS.escape(fragment.slice(1))}"]`)) {
      out.staleAnchors.push(`${describe(link)} → ${fragment}`);
    }
  }

  return out;
}

/*
 * Theme state, and the contrast the palette actually produces.
 *
 * Contrast is measured from the *computed* custom properties rather than from
 * the source values, because the source is `color-mix(...)` in places and
 * because a token that fails to resolve would otherwise be read as "fine". The
 * light theme is a new surface for this palette, and a light theme that quietly
 * ships 3:1 secondary text is the classic way a dark-only design regresses.
 */
function auditTheme() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  document.body.appendChild(probe);

  /* Round-tripping through a real element normalises hex, rgb() and color-mix()
     into one parseable form. */
  const resolve = (value) => {
    probe.style.color = "";
    probe.style.color = value;
    return getComputedStyle(probe).color;
  };

  const parse = (rgb) => {
    const match = String(rgb).match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return { r: parts[0], g: parts[1], b: parts[2] };
  };

  const channel = (value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  const luminance = (rgb) => 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);

  const contrast = (a, b) => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const names = ["--background", "--foreground", "--muted-foreground", "--foreground-dim", "--accent"];
  const resolved = {};
  for (const name of names) resolved[name] = resolve(style.getPropertyValue(name).trim());
  /* The viewer's scrim is deliberately NOT theme-mapped, so it is resolved too
     and asserted to be identical in both themes. */
  const scrim = resolve(style.getPropertyValue("--scrim").trim());
  probe.remove();

  const background = parse(resolved["--background"]);
  const pairs = [];
  for (const name of names.slice(1)) {
    const rgb = parse(resolved[name]);
    pairs.push({
      name,
      value: resolved[name],
      ratio: rgb && background ? Number(contrast(rgb, background).toFixed(2)) : null,
    });
  }

  return {
    classes: root.className,
    colorScheme: style.colorScheme,
    stored: (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })(),
    background: resolved["--background"],
    scrim,
    pairs,
  };
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    /* ————————————————————————————————————————————————————————————
     * Pass 1 — every route at every viewport.
     * ———————————————————————————————————————————————————————————— */
    for (const route of ROUTES) {
      for (const vp of VIEWPORTS) {
        const where = `${route.label} ${vp.name}`;
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

        const url = BASE + route.path;
        const response = await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
        const status = response ? response.status() : 0;
        /* 304 is a cache hit, not a failure. */
        if (!response || (status >= 400 && status !== 304)) {
          fail(where, `HTTP ${status || "no response"} from ${url}`);
          await page.close();
          continue;
        }

        await settle(page);
        const data = await page.evaluate(collect);

        /* ————— horizontal overflow ————— */
        if (data.scrollWidth > data.clientWidth + 1) {
          fail(where, `horizontal overflow: scrollWidth ${data.scrollWidth} > ${data.clientWidth}`);
        }
        for (const item of data.overflowing.slice(0, 6)) {
          fail(where, `overflows viewport (${item.left}…${item.right}px): ${item.el}`);
        }

        /* ————— touch targets —————
           44px is the practical touch bar (WCAG 2.5.5 / Apple HIG); 24px is the
           WCAG 2.5.8 AA minimum that applies to pointer input generally. */
        const minTarget = vp.mobile ? 44 : 24;
        const small = data.targets.filter((t) => t.w < minTarget || t.h < minTarget);
        for (const item of small.slice(0, 8)) {
          fail(where, `target ${item.w}×${item.h} (<${minTarget}px): ${item.el}`);
        }

        /* ————— accessible names ————— */
        for (const item of data.unnamed.slice(0, 8)) {
          fail(where, `interactive element with no accessible name: ${item}`);
        }

        /* ————— alt text ————— */
        for (const item of data.emptyAlt.slice(0, 8)) fail(where, item);

        /* ————— images that reserve their box ————— */
        for (const item of data.unsized.slice(0, 8)) fail(where, item);

        /* ————— heading order ————— */
        const h1s = data.headings.filter((h) => h.level === 1);
        if (h1s.length !== 1) fail(where, `expected exactly one <h1>, found ${h1s.length}`);
        for (let i = 1; i < data.headings.length; i++) {
          const prev = data.headings[i - 1];
          const curr = data.headings[i];
          if (curr.level > prev.level + 1) {
            fail(where, `heading level skips h${prev.level} → h${curr.level} at "${curr.text}"`);
          }
        }

        /* ————— ids ————— */
        for (const item of data.duplicateIds) fail(where, `duplicate id: ${item}`);

        /* ————— scroll entrances actually arrived ————— */
        for (const item of data.unrevealed) fail(where, item);

        /* ————— in-page links that point at nothing ————— */
        for (const item of data.staleAnchors) {
          fail(where, `in-page link resolves to no element: ${item}`);
        }

        /* ————— the home page's contents list —————
           Home loads in the Featured view, so the table is one toggle away:
           exactly one of the teaser card and the table is present. The
           toggle interaction below drives both directions and counts the rows. */
        if (route.label === "home") {
          const cards = data.headings.filter((h) => h.level === 3 && h.text === "CafeERP").length;
          if (data.tables.length > 1) {
            fail(where, `expected at most one <table>, found ${data.tables.length}`);
          } else if (data.tables.length === 1) {
            const table = data.tables[0];
            const expected = ["Project", "Tech stack", "Year"];
            if (table.columns.join("|") !== expected.join("|")) {
              fail(where, `table columns are [${table.columns.join(", ")}], expected [${expected.join(", ")}]`);
            }
            if (table.rows < 1) fail(where, "table has no body rows");
            if (table.rowHeaders !== table.rows) {
              fail(where, `only ${table.rowHeaders} of ${table.rows} rows are headed by their subject`);
            }
            if (!table.caption) fail(where, "table has no <caption>");
          } else if (cards < 1) {
            fail(where, "home shows neither the teaser card nor the table");
          }
        }

        /* ————— text size ————— */
        for (const item of data.tinyText.slice(0, 5)) {
          notes.push(`[${where}] text under 12px: ${item}`);
        }

        for (const item of consoleErrors) fail(where, `console: ${item}`);

        await page.screenshot({
          path: path.join(OUT, `${route.label}-${vp.name}.png`),
          fullPage: true,
        });
        notes.push(
          `[${where}] ok — ${data.headings.length} headings, ${data.overflowing.length} overflow, ${small.length} targets under ${minTarget}px`,
        );
        await page.close();
      }
    }

    /* ————————————————————————————————————————————————————————————
     * Interaction: the Work browser (Featured/Index toggle), the detail
     * document, and the screenshot viewer.
     * ———————————————————————————————————————————————————————————— */
    const page = await browser.newPage();
    const interactionErrors = [];
    page.on("pageerror", (err) => interactionErrors.push(err.message));
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 45000 });
    await settle(page);

    /* ————— the Featured/Index toggle ————— */
    const browserState = await page.evaluate(() => {
      const group = document.querySelector('[role="group"][aria-label="Work view"]');
      const buttons = group ? Array.from(group.querySelectorAll("button")) : [];
      return {
        options: buttons.map((b) => b.textContent.trim()),
        pressed: buttons.map((b) => b.getAttribute("aria-pressed")),
        card: !!document.querySelector("#work article"),
        table: !!document.querySelector("#work table"),
        steppers: document.querySelectorAll("#work button[aria-label='Previous project'], #work button[aria-label='Next project']").length,
      };
    });
    if (browserState.options.join("|") !== "Featured|Index") {
      fail("interaction", `view toggle options are [${browserState.options.join(", ")}], expected Featured, Index`);
    }
    if (browserState.pressed.join("|") !== "true|false") {
      fail("interaction", "Featured is not the default pressed view");
    }
    if (!browserState.card || browserState.table) {
      fail("interaction", "the Featured view does not show exactly one teaser card");
    }
    /* One project means nothing to step through: steppers stay out entirely. */
    if (browserState.steppers !== 0) {
      fail("interaction", `expected no steppers for a single project, found ${browserState.steppers}`);
    }

    const indexToggle = await page.evaluateHandle(() => {
      const group = document.querySelector('[role="group"][aria-label="Work view"]');
      return group ? Array.from(group.querySelectorAll("button")).find((b) => b.textContent.trim() === "Index") : null;
    });
    if (!indexToggle.asElement()) {
      fail("interaction", "Index toggle button not found");
    } else {
      await indexToggle.asElement().click();
      await sleep(500);
      const indexView = await page.evaluate(() => ({
        card: !!document.querySelector("#work article"),
        table: !!document.querySelector("#work table"),
        rows: document.querySelectorAll("#work table tbody tr").length,
        pressed: document.querySelector('[role="group"][aria-label="Work view"] [aria-pressed="true"]')?.textContent.trim() ?? null,
      }));
      if (indexView.card || !indexView.table) fail("interaction", "Index view does not show the table");
      if (indexView.rows < 1) fail("interaction", "Index table has no rows");
      if (indexView.pressed !== "Index") fail("interaction", "Index toggle did not report aria-pressed=true");
      notes.push(`[interaction] toggle → Index: table with ${indexView.rows} row(s)`);

      const featuredToggle = await page.evaluateHandle(() => {
        const group = document.querySelector('[role="group"][aria-label="Work view"]');
        return group ? Array.from(group.querySelectorAll("button")).find((b) => b.textContent.trim() === "Featured") : null;
      });
      await featuredToggle.asElement().click();
      await sleep(500);
      const backToFeatured = await page.evaluate(() => ({
        card: !!document.querySelector("#work article"),
        table: !!document.querySelector("#work table"),
      }));
      if (!backToFeatured.card || backToFeatured.table) {
        fail("interaction", "Featured toggle did not restore the teaser card");
      }
    }

    /* ————— the detail document: open, complete, no disclosure ————— */
    await page.goto(BASE + "/projects/cafeerp", { waitUntil: "networkidle0", timeout: 45000 });
    await settle(page);
    const detail = await page.evaluate(() => {
      const main = document.getElementById("main");
      return {
        h1: document.querySelector("h1")?.textContent.trim() ?? null,
        sections: main ? main.querySelectorAll("section").length : 0,
        disclosure: !!document.querySelector('button[aria-controls^="case-study-"]'),
        plates: main ? main.querySelectorAll("ul li button").length : 0,
        retro: Array.from(main ? main.querySelectorAll("h2") : []).some((h) =>
          h.textContent.includes("What I'd Do Differently"),
        ),
        back: !!document.querySelector('a[href="/#work"]'),
        neighbors: Array.from(document.querySelectorAll('nav[aria-label="More projects"] a')).map((a) => a.getAttribute("href")),
        title: document.title,
      };
    });
    if (detail.h1 !== "CafeERP") fail("interaction", `detail h1 is "${detail.h1}", expected CafeERP`);
    if (detail.sections !== 5) fail("interaction", `expected 5 case-study sections, found ${detail.sections}`);
    if (detail.disclosure) fail("interaction", "detail page hides prose behind a disclosure — the page is the study");
    if (!detail.retro) fail("interaction", "retrospective section missing from the detail page");
    if (!detail.back) fail("interaction", "detail page has no back link to /#work");
    if (!detail.title.startsWith("CafeERP")) fail("interaction", `document title is "${detail.title}" on the detail page`);
    notes.push(
      `[interaction] detail: h1="${detail.h1}", ${detail.sections} sections, ${detail.plates} plates, title="${detail.title}"`,
    );
    await page.screenshot({ path: path.join(OUT, "detail-open.png"), fullPage: false });

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
      await sleep(400);
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
        const probe = root.querySelector('a[href="/#work"]');
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

      await page.screenshot({ path: path.join(OUT, "home-viewer-open.png") });

      await page.keyboard.press("Escape");
      await sleep(400);
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

    /* ————————————————————————————————————————————————————————————
     * Routing: the table's detail links, the back link, the silent redirect
     * for dead URLs, and the back button through the history stack.
     *
     * Starts from a fresh home page in Index view, so the stack under test
     * is `/` → `/projects/cafeerp` and one back means what it asserts.
     * ———————————————————————————————————————————————————————————— */
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 45000 });
    await settle(page);
    /* The table lives behind the Index toggle; the Featured card is default. */
    await page.evaluate(() => {
      const group = document.querySelector('[role="group"][aria-label="Work view"]');
      const target = group
        ? Array.from(group.querySelectorAll("button")).find((b) => b.textContent.trim() === "Index")
        : null;
      if (target) target.click();
    });
    await sleep(500);
    const tableLink = await page.evaluateHandle(() =>
      document.querySelector('#work table a[href="/projects/cafeerp"]'),
    );
    const tableEl = tableLink.asElement();
    if (!tableEl) {
      fail("routing", "the table's project name does not link to /projects/cafeerp");
    } else {
      await tableEl.click();
      await sleep(700);
      const landed = await page.evaluate(() => ({
        path: window.location.pathname,
        title: document.title,
        h1: document.querySelector("h1")?.textContent.trim().slice(0, 60) ?? null,
        scrolledToTop: window.scrollY < 4,
      }));
      if (landed.path !== "/projects/cafeerp") {
        fail("routing", `table link landed on ${landed.path}, expected /projects/cafeerp`);
      }
      if (!landed.title.startsWith("CafeERP")) {
        fail("routing", `document title is "${landed.title}" on the detail page`);
      }
      if (!landed.scrolledToTop) fail("routing", "the detail page did not open at the top");
      notes.push(`[routing] table link → ${landed.path}, title="${landed.title}", h1="${landed.h1}"`);

      /* The back link returns home and lands on the Work section it names. */
      const backLink = await page.evaluateHandle(() => document.querySelector('a[href="/#work"]'));
      const backEl = backLink.asElement();
      if (!backEl) {
        fail("routing", "detail page has no back link to /#work");
      } else {
        await backEl.click();
        await sleep(700);
        const backHome = await page.evaluate(() => {
          const work = document.getElementById("work");
          const nav = Array.from(document.querySelectorAll('nav[aria-label="Primary"]')).find(
            (el) => el.getBoundingClientRect().height > 0,
          );
          return {
            path: window.location.pathname,
            hash: window.location.hash,
            top: work ? Math.round(work.getBoundingClientRect().top) : null,
            navHeight: nav ? Math.round(nav.getBoundingClientRect().height) : 0,
          };
        });
        if (backHome.path !== "/" || backHome.hash !== "#work") {
          fail("routing", `back link landed on ${backHome.path}${backHome.hash}, expected /#work`);
        }
        if (backHome.top !== null && backHome.top < backHome.navHeight) {
          fail("routing", `#work landed at ${backHome.top}px, under the ${backHome.navHeight}px fixed nav`);
        }
        notes.push(`[routing] back link → ${backHome.path}${backHome.hash}, work top ${backHome.top}px`);
      }

      /*
       * One step back through the history stack: detail → home through the
       * `popstate` listener. (The back link above pushed its own entry, so go
       * back twice to return past it: back-link landing, then the detail.)
       */
      await page.goBack({ waitUntil: "networkidle0" });
      await sleep(500);
      await page.goBack({ waitUntil: "networkidle0" });
      await sleep(500);
      const afterBack = await page.evaluate(() => ({
        path: window.location.pathname,
        h1: document.querySelector("h1")?.textContent.trim().slice(0, 40) ?? null,
      }));
      if (afterBack.path !== "/") {
        fail("routing", `back landed on ${afterBack.path}, expected /`);
      }
      notes.push(`[routing] back through history → ${afterBack.path} (h1="${afterBack.h1}")`);
    }

    /* ————— dead URLs redirect home silently ————— */
    for (const dead of ["/projects", "/projects/does-not-exist"]) {
      await page.goto(BASE + dead, { waitUntil: "networkidle0", timeout: 45000 });
      await sleep(500);
      const resolved = await page.evaluate(() => ({
        path: window.location.pathname,
        h1: document.querySelector("h1")?.textContent.trim().slice(0, 40) ?? null,
      }));
      if (resolved.path !== "/") {
        fail("routing", `${dead} resolved to ${resolved.path}, expected a silent redirect to /`);
      }
      notes.push(`[routing] ${dead} → ${resolved.path} (h1="${resolved.h1}")`);
    }

    /* ————————————————————————————————————————————————————————————
     * Theme: the stored preference, the switch, and the contrast the palette
     * actually produces in each theme.
     * ———————————————————————————————————————————————————————————— */
    const themePage = await browser.newPage();
    const themeErrors = [];
    themePage.on("pageerror", (err) => themeErrors.push(err.message));
    await themePage.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

    await themePage.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 45000 });

    /*
     * No-flash evidence. The theme class is applied by a synchronous inline
     * script in <head>, so it must already be on <html> by the time the parser
     * has finished — well before the deferred module bundle that renders React.
     * Asserting it at `domcontentloaded` is the closest a headless run gets to
     * "before first paint".
     */
    await themePage.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
    const early = await themePage.evaluate(() => document.documentElement.className);
    if (!/\b(light|dark)\b/.test(early)) {
      fail("theme", `<html> had no theme class at DOMContentLoaded (class="${early}") — the pre-paint script did not run`);
    }
    const hasInlineScript = await themePage.evaluate(() =>
      Array.from(document.querySelectorAll("head script")).some(
        (s) => !s.src && s.textContent.includes("localStorage.getItem('theme')"),
      ),
    );
    if (!hasInlineScript) fail("theme", "the pre-paint theme script is not inline in <head>");
    notes.push(`[theme] pre-paint class at DOMContentLoaded: "${early}"`);

    /* Both themes, measured — driven through the switch, never by writing the
       class directly. Writing the class from the outside leaves React's copy of
       the state stale (the store only hears about changes made through
       `setTheme`), and the test then measures its own interference: an earlier
       version of this block reported the switch as broken when it was fine. */
    await themePage.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 45000 });

    const findSwitch = () =>
      themePage
        .evaluateHandle(() =>
          Array.from(document.querySelectorAll('[role="switch"]')).find(
            (el) => el.getBoundingClientRect().width > 0,
          ) ?? null,
        )
        .then((handle) => handle.asElement());

    const switchEl = await findSwitch();
    if (!switchEl) {
      fail("theme", "no visible [role=switch] theme control found");
    } else {
      const instances = await themePage.evaluate(
        () => document.querySelectorAll('[role="switch"]').length,
      );
      notes.push(`[theme] ${instances} switch instance(s) mounted (desktop nav + phone pill)`);

      const first = await themePage.evaluate(auditTheme);
      const firstChecked = await switchEl.evaluate((el) => el.getAttribute("aria-checked"));
      const firstLabel = await switchEl.evaluate((el) => el.getAttribute("aria-label"));

      if (!firstLabel) fail("theme", "the theme switch has no accessible name");
      if (!/\b(light|dark)\b/.test(first.classes)) {
        fail("theme", `<html> carries no theme class (class="${first.classes}")`);
      }

      await switchEl.click();
      await sleep(400);
      const second = await themePage.evaluate(auditTheme);
      const secondChecked = await switchEl.evaluate((el) => el.getAttribute("aria-checked"));

      const firstTheme = first.classes.includes("dark") ? "dark" : "light";
      const secondTheme = second.classes.includes("dark") ? "dark" : "light";

      if (firstTheme === secondTheme) {
        fail("theme", `clicking the switch left the theme on ${secondTheme}`);
      }
      if (firstChecked === secondChecked) {
        fail("theme", `aria-checked stayed ${firstChecked} across the click`);
      }
      if (secondChecked !== (secondTheme === "dark" ? "true" : "false")) {
        fail("theme", `aria-checked is ${secondChecked} while the theme is ${secondTheme}`);
      }
      if (second.stored !== secondTheme) {
        fail("theme", `the switch stored "${second.stored}" while the theme is ${secondTheme}`);
      }
      if (second.colorScheme !== secondTheme) {
        fail("theme", `${secondTheme} reports color-scheme "${second.colorScheme}"`);
      }
      if (first.background === second.background) {
        fail("theme", "the two themes resolve to the same background — the tokens are not switching");
      }
      if (first.scrim !== second.scrim) {
        fail(
          "theme",
          `the viewer scrim changed between themes (${first.scrim} → ${second.scrim}); it is meant to be theme-independent`,
        );
      }

      for (const [name, data] of [
        [firstTheme, first],
        [secondTheme, second],
      ]) {
        for (const pair of data.pairs) {
          if (pair.ratio === null) {
            fail("theme", `${name}: ${pair.name} did not resolve to a colour (${pair.value})`);
          } else if (pair.ratio < 4.5) {
            fail(
              "theme",
              `${name}: ${pair.name} is ${pair.ratio}:1 on the background — below WCAG AA for small text`,
            );
          }
        }
        notes.push(
          `[theme] ${name}: bg ${data.background}, ` +
            data.pairs.map((p) => `${p.name} ${p.ratio}:1`).join(", "),
        );
      }

      /* The stored preference has to be honoured *before* the app renders, so
         reload and check the class came back as the theme we left it on. */
      await themePage.reload({ waitUntil: "networkidle0", timeout: 45000 });
      const restored = await themePage.evaluate(auditTheme);
      const restoredTheme = restored.classes.includes("dark") ? "dark" : "light";
      if (restoredTheme !== secondTheme) {
        fail(
          "theme",
          `after a reload the theme is ${restoredTheme}, expected ${secondTheme} — the pre-paint script did not read the stored preference`,
        );
      }
      notes.push(`[theme] reload restored "${restoredTheme}" from the stored preference`);

      /*
       * Light-mode captures. Measuring contrast proves the palette is legible;
       * it does not prove the light theme *looks* like this site. These are the
       * only screenshots that show it, so they are the ones to actually open.
       */
      if (restoredTheme !== "light") {
        const again = await findSwitch();
        if (again) {
          await again.click();
          await sleep(400);
        }
      }
      for (const [label, routePath] of [
        ["home", "/"],
        ["index", "/projects"],
      ]) {
        for (const vp of [VIEWPORTS[1], VIEWPORTS[5]]) {
          await themePage.setViewport({
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 1,
          });
          await themePage.goto(BASE + routePath, { waitUntil: "networkidle0", timeout: 45000 });
          await settle(themePage);
          await themePage.screenshot({
            path: path.join(OUT, `light-${label}-${vp.name}.png`),
            fullPage: true,
          });
        }
      }
      const lightConfirmed = await themePage.evaluate(
        () => !document.documentElement.classList.contains("dark"),
      );
      if (!lightConfirmed) fail("theme", "the light-mode captures were taken in the dark theme");
      notes.push("[theme] light-mode captures written for both routes at 375 and 1440");
    }

    for (const err of themeErrors) fail("theme", `pageerror: ${err}`);
    await themePage.close();

    for (const err of interactionErrors) fail("interaction", `pageerror: ${err}`);
    await page.close();

    /* ————— reduced motion: content must still be visible ————— */
    const rmPage = await browser.newPage();
    await rmPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await rmPage.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await rmPage.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 45000 });
    await sleep(500);
    const rm = await rmPage.evaluate(() => {
      const hidden = [];
      for (const el of document.querySelectorAll("h1, h2, h3, section p")) {
        const style = getComputedStyle(el);
        if (parseFloat(style.opacity) < 0.9) hidden.push(el.tagName + " " + el.textContent.trim().slice(0, 40));
      }
      /* The headline's rule is drawn at rest, so a reduced-motion visitor sees a
         mark rather than a gap. There is no arrival sweep anymore — the check
         reads the static drawn rule directly. */
      const drawn = document.querySelector(".underline-drawn");
      return {
        hidden,
        h1: document.querySelector("h1")?.textContent.trim().slice(0, 60) ?? null,
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        headlineRule: drawn
          ? getComputedStyle(drawn).backgroundSize
          : null,
      };
    });
    if (rm.hidden.length) {
      fail("reduced-motion", `content left invisible: ${rm.hidden.slice(0, 5).join(" | ")}`);
    }
    if (rm.scrollBehavior !== "auto") {
      fail("reduced-motion", `smooth scrolling still on (scroll-behavior: ${rm.scrollBehavior})`);
    }
    if (!rm.headlineRule || rm.headlineRule.startsWith("0%")) {
      fail("reduced-motion", `the headline underline is missing or undrawn (${rm.headlineRule})`);
    }
    notes.push(
      `[reduced-motion] no hidden content; scroll-behavior: ${rm.scrollBehavior}; headline rule: ${rm.headlineRule}; h1="${rm.h1}"`,
    );
    await rmPage.close();
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
