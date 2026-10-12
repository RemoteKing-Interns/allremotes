import { config } from "dotenv";
config({ path: ".env.local" });
async function main() {
  const { temuCall } = await import("../src/lib/channels/temu");
  const creds: any = { accessToken: process.env.TEMU_ACCESS_TOKEN!, sellerId: process.env.TEMU_MALL_ID, expiresAt: "" };

  // Readable status list
  for (const st of ["INACTIVE", "INCOMPLETE", "DRAFT"]) {
    try {
      const r = await temuCall("temu.local.goods.list.retrieve", { goodsSearchType: st, pageNo: 1, pageSize: 100 }, creds);
      const list = r.result?.goodsList || [];
      console.log(`\n=== ${st}: total=${r.result?.total ?? "?"} ===`);
      const sub: Record<string, number> = {};
      for (const g of list) { const k = `${g.goodsStatus}`; sub[k] = (sub[k] || 0) + 1; }
      console.log(JSON.stringify(sub));
      for (const g of list.slice(0, 6)) console.log("  ", g.goodsId, "|", g.goodsStatus, "|", g.outSkuSnList?.[0] || g.outGoodsSn, "|", String(g.goodsName || "").slice(0, 45));
    } catch (e: any) {
      console.log(`${st}: FAIL`, String(e?.message || e).slice(0, 120));
    }
  }

  // Compliance problems: action required / rejected / to be updated / not submitted
  for (const statusList of [[4], [6], [7], [1]]) {
    try {
      const r = await temuCall("bg.local.compliance.goods.list.query", { pageNo: 1, pageSize: 25, statusList }, creds);
      const list = r.result?.goodsList || [];
      console.log(`\n=== compliance status=${statusList}: total=${r.result?.total ?? "?"} ===`);
      for (const g of list.slice(0, 10)) console.log("  ", g.goodsId, "|", String(g.goodsName || "").slice(0, 50), "|", JSON.stringify({ t: g.extraTemplateInfoList?.map((x: any) => x.status), gpsr: g.gpsrInfoList?.map((x: any) => x.status), rep: g.repInfoList?.map((x: any) => x.status), photo: g.actualPhotoList?.map((x: any) => x.status), cert: g.certificateInfoList?.map((x: any) => x.status) }));
    } catch (e: any) {
      console.log(`compliance ${statusList}: FAIL`, String(e?.message || e).slice(0, 120));
    }
  }
  process.exit(0);
}
main();
