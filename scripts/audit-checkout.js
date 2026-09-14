// Audit real checkout form at mobile widths with a guest cart injected.
const { chromium } = require("playwright-core");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("cart_guest", JSON.stringify([{
      id: "p1", name: "Merlin Garage Remote", price: 49.95, quantity: 2,
      image: "", sku: "TEST-SKU",
    }]));
  });

  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("http://localhost:3000/checkout?guest=1", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const out = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      const cw = el.clientWidth;
      const res = {
        url: location.pathname + location.search,
        overflow: el.scrollWidth > cw + 1 ? { scrollWidth: el.scrollWidth, clientWidth: cw } : null,
        inputs: document.querySelectorAll("input, select, textarea").length,
        visibleForm: !!document.querySelector("form, input[name], input[type]"),
        tiny: [],
      };
      for (const n of document.querySelectorAll("button, a[href], input[type='submit']")) {
        const r = n.getBoundingClientRect();
        const s = getComputedStyle(n);
        if (s.display === "none" || s.visibility === "hidden" || r.width === 0) continue;
        if (n.tagName === "A" && s.display === "inline") continue;
        if (r.height < 40 && r.width < 40) {
          res.tiny.push(`${n.tagName.toLowerCase()}.${String(n.className).slice(0, 50)} ${Math.round(r.width)}x${Math.round(r.height)} "${(n.textContent || "").slice(0, 25).trim()}"`);
          if (res.tiny.length > 6) break;
        }
      }
      return res;
    });
    console.log(`${out.overflow || out.tiny.length ? "✗" : "✓"} /checkout?guest=1 @ ${width}px — inputs=${out.inputs} overflow=${JSON.stringify(out.overflow)} tiny=${JSON.stringify(out.tiny)}`);
  }
  await browser.close();
})();
