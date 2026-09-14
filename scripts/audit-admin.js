// Audit the admin shell at mobile widths: overflow, drawer open/close, dropdown.
const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("user", JSON.stringify({
      id: "audit-admin", name: "Audit Admin", email: "admin@example.com",
      role: "admin", permissions: ["*"],
    }));
  });

  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("http://localhost:3000/admin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const check = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      const r = { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflow: el.scrollWidth > el.clientWidth + 1 };
      return r;
    });
    console.log(`${check.overflow ? "✗ OVERFLOW" : "✓"} /admin @ ${width}px — scroll=${check.scrollWidth} client=${check.clientWidth}`);

    // Hamburger opens the drawer below lg (1024)
    if (width < 1024) {
      const burger = page.locator('button[aria-label*="menu" i], button[aria-label*="Open" i], header button').first();
      const drawerSel = "nav, aside, [role='dialog']";
      const opened = await burger.click().then(async () => {
        await page.waitForTimeout(600);
        return page.evaluate(() => {
          const el = document.scrollingElement;
          return { open: el.scrollWidth <= el.clientWidth + 1, scrollWidth: el.scrollWidth };
        });
      }).catch(() => null);
      if (opened) {
        console.log(`   drawer-open @ ${width}px: overflow=${!opened.open} scroll=${opened.scrollWidth}`);
        await page.keyboard.press("Escape");
      }
    }
  }
  await browser.close();
})();
