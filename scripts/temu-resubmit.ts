import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { temuAdapter } = await import("../src/lib/channels/temu");
  const creds = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID };
  const goodsId = process.argv[2];
  if (!goodsId) { console.error("Usage: npx tsx scripts/temu-resubmit.ts <goodsId>"); process.exit(1); }
  const r = await temuAdapter.updateListing(goodsId, {
    sku: "AR-BEN02", title: "Beninca TO.GO 433MHz 2-Button Remote", description: "",
    price: 24.95, currency: "AUD", quantity: 10, images: [],
  }, creds);
  console.log("resubmit result:", JSON.stringify(r));
  process.exit(0);
})();
