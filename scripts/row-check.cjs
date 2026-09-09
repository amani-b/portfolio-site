const puppeteer = require("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
  await p.evaluate(() => document.querySelector("a[href='/projects/cafeerp']")?.scrollIntoView({ block: "center" }));
  await new Promise(r => setTimeout(r, 1200));
  const visible = await p.$eval("a[href='/projects/cafeerp']", el => {
    const s = getComputedStyle(el.closest(".reveal") || el);
    const r = el.getBoundingClientRect();
    return { opacity: s.opacity, inViewport: r.top >= 0 && r.top < window.innerHeight, text: el.querySelector("h3")?.textContent };
  });
  console.log(JSON.stringify(visible));
  await p.screenshot({ path: "screenshots/final-index-row-mobile.png" });
  await b.close();
})();
