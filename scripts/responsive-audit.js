// Viewport responsiveness audit — finds horizontal overflow and undersized
// touch targets across key routes. Run: node scripts/responsive-audit.js
// Requires production server on :3000 (npm run build && npm start).
const { chromium } = require("playwright-core");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.AUDIT_BASE || "http://localhost:3000";

const ROUTES = [
  "/", "/products/all", "/products/garage", "/cart", "/checkout",
  "/login", "/register", "/forgot-password", "/account", "/wishlist",
  "/shop-by-brand", "/brands/Merlin", "/contact", "/about", "/blog",
  "/support/which-garage-door-remote-do-i-need", "/garage-door-remotes",
  "/order-success", "/nonexistent-page-404",
];

const VIEWPORTS = [
  { name: "320px", width: 320, height: 568 },
  { name: "375px", width: 375, height: 667 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1280px", width: 1280, height: 800 },
  { name: "1920px", width: 1920, height: 1080 },
];

async function auditRoute(browser, route, vp) {
  const issues = [];
  const page = await browser.newPage();
  try {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch (firstErr) {
      // One retry — a single hung navigation shouldn't fail the whole combo
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    await page.waitForTimeout(1500);

    // Horizontal overflow
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      if (el.scrollWidth <= el.clientWidth + 1) return null;
      // Find the widest offenders
      const offenders = [];
      for (const node of document.querySelectorAll("body *")) {
        const r = node.getBoundingClientRect();
        if (r.right > el.clientWidth + 1 || r.left < -1) {
          const cls = (node.className && typeof node.className === "string")
            ? node.className.slice(0, 80) : "";
          offenders.push(`${node.tagName.toLowerCase()}.${cls} right=${Math.round(r.right)} left=${Math.round(r.left)}`);
          if (offenders.length >= 5) break;
        }
      }
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, offenders };
    });
    if (overflow) {
      issues.push(`H-OVERFLOW: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth} | ${overflow.offenders.join(" ;; ")}`);
    }

    // Tiny touch targets (only on <=768px)
    if (vp.width <= 768) {
      const tiny = await page.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll("a, button, input, select, textarea, [role='button']")) {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") continue;
          if (r.width === 0 || r.height === 0) continue;
          // Skip inline text links — they're allowed to be smaller
          if (el.tagName === "A" && style.display === "inline") continue;
          if (r.height < 40 && r.width < 40) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
            bad.push(`${el.tagName.toLowerCase()}.${cls} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").slice(0, 30).trim()}"`);
            if (bad.length >= 8) break;
          }
        }
        return bad;
      });
      if (tiny.length) issues.push(`TINY-TARGETS: ${tiny.join(" ;; ")}`);
    }
  } catch (err) {
    issues.push(`LOAD-FAIL: ${err.message.split("\n")[0]}`);
  } finally {
    await page.close().catch(() => {});
  }
  return issues;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const report = [];

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const issues = await auditRoute(browser, route, vp);
      if (issues.length) {
        report.push({ route, viewport: vp.name, issues });
        console.log(`✗ ${route} @ ${vp.name}: ${issues.length} issue(s)`);
        issues.forEach((i) => console.log(`    ${i}`));
      } else {
        console.log(`✓ ${route} @ ${vp.name}`);
      }
    }
  }

  await browser.close();
  console.log(`\n=== ${report.length === 0 ? "CLEAN" : `${report.length} route+viewport combos with issues`} ===`);
  process.exit(report.length ? 1 : 0);
})();
