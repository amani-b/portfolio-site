const puppeteer = require("puppeteer-core");
const fs = require("fs");

(async () => {
  fs.mkdirSync("screenshots", { recursive: true });
  const b = await puppeteer.launch({
    executablePath: "C:/Users/user/AppData/Local/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox"],
  });
  const p = await b.newPage();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // 1) Toggle in light mode (desktop)
  await p.setViewport({ width: 1440, height: 900 });
  await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await sleep(800);
  await p.screenshot({ path: "screenshots/fix-toggle-light.png", clip: { x: 900, y: 0, width: 540, height: 90 } });

  // 2) Toggle in dark mode
  await p.evaluate(() => document.querySelector('button[role="switch"]').click());
  await sleep(600);
  await p.screenshot({ path: "screenshots/fix-toggle-dark.png", clip: { x: 900, y: 0, width: 540, height: 90 } });

  // 3) Project row at rest + hover (dark mode, desktop)
  await p.goto("http://localhost:3000/projects", { waitUntil: "networkidle0" });
  await sleep(1200);
  const row = await p.evaluate(() => {
    const a = document.querySelector('a[href^="/projects/"]');
    a.scrollIntoView();
    const r = a.getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.top + window.scrollY - 40), w: r.width };
  });
  await p.screenshot({ path: "screenshots/fix-row-rest.png", clip: { x: 0, y: row.y, width: 1440, height: 140 } });
  const box = await (await p.$('a[href^="/projects/"]')).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(400);
  await p.screenshot({ path: "screenshots/fix-row-hover.png", clip: { x: 0, y: row.y, width: 1440, height: 140 } });

  // 4) Mobile header at 375px
  await p.setViewport({ width: 375, height: 812 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await sleep(800);
  const m = await p.evaluate(() => {
    const name = document.querySelector("header a").getBoundingClientRect();
    const nav = document.querySelector("nav").getBoundingClientRect();
    return { nameRight: Math.round(name.right), navLeft: Math.round(nav.left), navRight: Math.round(nav.right), vw: window.innerWidth };
  });
  console.log("MOBILE HEADER:", JSON.stringify(m));
  await p.screenshot({ path: "screenshots/fix-header-mobile.png", clip: { x: 0, y: 0, width: 375, height: 130 } });

  await b.close();
  console.log("VERIFY DONE");
})();