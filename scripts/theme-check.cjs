const puppeteer = require("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  const state = () => p.evaluate(() => ({ cls: document.documentElement.className, bg: getComputedStyle(document.body).backgroundColor }));
  console.log("initial:", JSON.stringify(await state()));
  await p.click("button[aria-label*='mode']");
  await new Promise(r => setTimeout(r, 500));
  console.log("after toggle:", JSON.stringify(await state()), "stored:", await p.evaluate(() => localStorage.getItem("theme")));
  await p.screenshot({ path: "screenshots/theme-toggled.png" });
  await p.reload({ waitUntil: "networkidle0" });
  console.log("after reload:", JSON.stringify(await state()));
  await p.click("button[aria-label*='mode']");
  await new Promise(r => setTimeout(r, 500));
  console.log("toggled back:", JSON.stringify(await state()));
  // mobile check
  const m = await b.newPage();
  await m.setViewport({ width: 390, height: 844 });
  await m.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await m.click("button[aria-label*='mode']");
  await new Promise(r => setTimeout(r, 500));
  await m.screenshot({ path: "screenshots/theme-mobile.png" });
  await b.close();
  console.log("THEME_OK");
})();
