import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { temuCall } = await import("../src/lib/channels/temu");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };
  const d = await temuCall("bg.order.detail.v2.get", { parentOrderSn: "PO-012-02925294121591154" }, creds);
  const list = (d.result as any)?.orderList || [];
  for (const it of list) console.log(JSON.stringify({ orderSn: it.orderSn, skuId: it.skuId, goodsId: it.goodsId, quantity: it.quantity, orig: it.originalOrderQuantity, canceled: it.canceledQuantityBeforeShipment }));
  process.exit(0);
})();
