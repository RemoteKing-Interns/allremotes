// One-off: find elements causing horizontal overflow at a given route+width.
const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const routeArg = process.argv[2] || "account";
const route = routeArg.startsWith("/") ? routeArg : "/" + routeArg;
const width = parseInt(process.argv[3] || "375", 10);

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.setViewportSize({ width, height: 667 });
  await page.goto("http://localhost:3000" + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const out = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    const cw = el.clientWidth;
    const res = { url: location.pathname, scrollWidth: el.scrollWidth, clientWidth: cw, offenders: [] };
    const all = [document.documentElement, document.body, ...document.querySelectorAll("body *")];
    for (const n of all) {
      const r = n.getBoundingClientRect();
      if (r.right > cw + 1 || r.left < -1) {
        res.offenders.push(
          `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 90)} right=${Math.round(r.right)} left=${Math.round(r.left)} w=${Math.round(r.width)}`
        );
        if (res.offenders.length > 12) break;
      }
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
