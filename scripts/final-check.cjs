const puppeteer = require("puppeteer-core");
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: "new", args: ["--no-sandbox"] });
  for (const [w, h, tag] of [[1440, 900, "desktop"], [390, 844, "mobile"]]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h });
    // light mode
    await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
    await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 900));
    await p.screenshot({ path: `screenshots/final-home-light-${tag}.png`, fullPage: true });
    await p.goto("http://localhost:3000/projects/cafeerp", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 900));
    await p.screenshot({ path: `screenshots/final-detail-light-${tag}.png` });
    // dark mode
    await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
    await p.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 900));
    await p.screenshot({ path: `screenshots/final-home-dark-${tag}.png` });
    await p.goto("http://localhost:3000/projects/cafeerp", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 900));
    await p.screenshot({ path: `screenshots/final-detail-dark-${tag}.png` });
    await p.close();
  }
  await b.close();
  console.log("SHOTS DONE");
})();
