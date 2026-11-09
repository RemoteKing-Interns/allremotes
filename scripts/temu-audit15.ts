import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };
  const r = await temuCall("bg.local.goods.list.query", { pageNo: 1, pageSize: 50, goodsSearchType: 5 }, creds);
  for (const g of r.result?.goodsList || []) console.log(g.goodsId, (g.outSkuSnList || [])[0], g.goodsName);
  console.log("total drafts:", r.result?.total);
  process.exit(0);
})();
