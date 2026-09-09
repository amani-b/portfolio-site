/* Full redesign verification: renders + carousel gesture behavior. */
const puppeteer = require("puppeteer-core");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:3000";

async function withPage(browser, width, height, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(BASE + "/", { waitUntil: "networkidle0" });
  await fn(page);
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--no-sandbox"] });

  // ---- Desktop screenshots ----
  await withPage(browser, 1440, 900, async (page) => {
    await page.screenshot({ path: "screenshots/v3-home-desktop.png" });
    await page.goto(BASE + "/projects/cafeerp", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: "screenshots/v3-detail-desktop.png" });
  });

  // ---- Mobile screenshots ----
  await withPage(browser, 390, 844, async (page) => {
    await page.screenshot({ path: "screenshots/v3-home-mobile.png" });
    await page.goto(BASE + "/projects/cafeerp", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: "screenshots/v3-detail-mobile.png" });
    await page.screenshot({ path: "screenshots/v3-detail-mobile-full.png", fullPage: true });
  });

  // ---- Carousel gesture behavior on the detail page ----
  await withPage(browser, 1440, 900, async (page) => {
    await page.goto(BASE + "/projects/cafeerp", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 500));
    const counter = () => page.$eval("p[aria-live=polite]", (el) => el.textContent.trim());

    console.log("initial counter:", await counter());

    // Drag LEFT → should advance (01 → 02)
    const box = await (await page.$("div[aria-roledescription=carousel]")).boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 200, cy, { steps: 8 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 700));
    console.log("after drag left:", await counter());

    // Drag RIGHT → should go back (02 → 01)
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 200, cy, { steps: 8 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 700));
    console.log("after drag right:", await counter());

    // Click after drag must NOT open the lightbox
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 250, cy, { steps: 8 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 300));
    const lightboxAfterDrag = await page.$("div[role=dialog]") !== null;
    console.log("lightbox open after drag (should be false):", lightboxAfterDrag);

    // Plain click SHOULD open the lightbox
    await page.mouse.click(cx, cy);
    await new Promise((r) => setTimeout(r, 600));
    const lightboxAfterClick = await page.$("div[role=dialog]") !== null;
    console.log("lightbox open after click (should be true):", lightboxAfterClick);
    await page.screenshot({ path: "screenshots/v3-lightbox.png" });

    // Esc closes
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 500));
    console.log("lightbox open after Esc (should be false):", (await page.$("div[role=dialog]")) !== null);

    // Arrow key on focused carousel advances
    await page.focus("div[aria-roledescription=carousel]");
    await page.keyboard.press("ArrowRight");
    await new Promise((r) => setTimeout(r, 600));
    console.log("after ArrowRight key:", await counter());

    // Prev button disabled state at index 0
    await page.keyboard.press("ArrowLeft");
    await new Promise((r) => setTimeout(r, 600));
    const prevDisabled = await page.$eval("button[aria-label='Previous screenshot']", (b) => b.disabled);
    console.log("prev disabled at first slide (should be true):", prevDisabled);
  });

  await browser.close();
  console.log("DONE");
})();
