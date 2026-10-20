// Pull remotepro.com.au catalog → rp-catalog.json
const out = [];
for (let page = 1; ; page++) {
  const r = await fetch(`https://www.remotepro.com.au/products.json?limit=250&page=${page}`);
  const j = await r.json();
  if (!j.products?.length) break;
  for (const p of j.products) {
    out.push({
      title: p.title,
      handle: p.handle,
      vendor: p.vendor,
      type: p.product_type,
      variants: (p.variants || []).map(v => ({ sku: v.sku, price: +v.price, avail: v.available })),
    });
  }
  process.stderr.write(`page ${page}: ${out.length} total\n`);
  await new Promise(r => setTimeout(r, 400));
  if (page > 60) break;
}
await import("fs").then(fs => fs.writeFileSync("rp-catalog.json", JSON.stringify(out, null, 1)));
console.log(`saved ${out.length} products`);
