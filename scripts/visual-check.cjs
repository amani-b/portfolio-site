/* Headless visual check: home page at desktop width (uses system Edge, no browser download). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });

  // Measured layout facts for the two reported issues
  const metrics = await page.evaluate(() => {
    const header = document.querySelector("header");
    const hero = document.querySelector("main section");
    const h1 = hero.querySelector("h1");
    const p = hero.querySelector("p");
    return {
      headerBottom: Math.round(header.getBoundingClientRect().bottom),
      h1Top: Math.round(h1.getBoundingClientRect().top),
      gapHeaderToH1: Math.round(h1.getBoundingClientRect().top - header.getBoundingClientRect().bottom),
      heroPadding: { top: getComputedStyle(hero).paddingTop, bottom: getComputedStyle(hero).paddingBottom },
      h1Width: Math.round(h1.getBoundingClientRect().width),
      pWidth: Math.round(p.getBoundingClientRect().width),
      pMaxWidth: getComputedStyle(p).maxWidth,
      pLines: Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)),
    };
  });
  console.log(JSON.stringify(metrics, null, 2));

  await page.screenshot({ path: "screenshots/home-desktop.png", fullPage: false });
  await browser.close();
  console.log("screenshot saved: screenshots/home-desktop.png");
})();
