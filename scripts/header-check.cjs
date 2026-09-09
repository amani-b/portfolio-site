const puppeteer = require("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  const m = await p.evaluate(() => {
    const name = document.querySelector("header a");
    const nav = document.querySelector("nav");
    return {
      nameHeight: Math.round(name.getBoundingClientRect().height),
      nameLines: Math.round(name.getBoundingClientRect().height / 24),
      fits: nav.getBoundingClientRect().right <= window.innerWidth,
    };
  });
  console.log(JSON.stringify(m));
  await p.screenshot({ path: "screenshots/header-mobile.png", clip: { x: 0, y: 0, width: 390, height: 120 } });
  await b.close();
})();
