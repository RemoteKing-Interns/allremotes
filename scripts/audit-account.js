// Audit the authenticated /account page (injects a fake localStorage session).
const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("user", JSON.stringify({
      id: "audit-user", name: "Audit User", email: "audit.user@example.com",
    }));
  });
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    for (const tab of ["basics", "orders", "returns", "payments", "addresses", "preferences", "reviews", "notifications", "help"]) {
      await page.goto(`http://localhost:3000/account?tab=${tab}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const out = await page.evaluate(() => {
        const el = document.scrollingElement || document.documentElement;
        const cw = el.clientWidth;
        if (el.scrollWidth <= cw + 1) return null;
        const offenders = [];
        for (const n of document.querySelectorAll("body *")) {
          const r = n.getBoundingClientRect();
          if (r.right > cw + 1 || r.left < -1) {
            offenders.push(`${n.tagName.toLowerCase()}.${String(n.className).slice(0, 80)} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
            if (offenders.length > 6) break;
          }
        }
        return { scrollWidth: el.scrollWidth, clientWidth: cw, offenders };
      });
      console.log(`${out ? "✗" : "✓"} /account?tab=${tab} @ ${width}px${out ? " — " + JSON.stringify(out) : ""}`);
    }
  }
  await browser.close();
})();
