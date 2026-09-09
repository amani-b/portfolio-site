const puppeteer = require("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 150)); });
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 150)));

  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });

  const names = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .map((e) => getComputedStyle(e).viewTransitionName)
      .filter((n) => n && n !== "none"),
  );
  console.log("home shared names:", JSON.stringify(names));

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(900);
  await page.click('a[href="/projects/cafeerp"]');
  await sleep(2500);
  console.log("after click url:", page.url());

  const heroName = await page.evaluate(() => {
    const f = document.querySelector("figure");
    return f ? getComputedStyle(f).viewTransitionName : "no-figure";
  });
  console.log("detail first figure name:", heroName);

  // Back/forward sanity
  await page.goBack();
  await sleep(1500);
  console.log("after back url:", page.url());

  console.log("errors:", errs.length ? errs : "none");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
