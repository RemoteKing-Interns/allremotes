import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { temuAdapter } = await import("../src/lib/channels/temu");
  const { getValidCredentials, saveChannelOrder } = await import("../src/lib/channels/db");
  const creds = await getValidCredentials("temu");
  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  const orders = await temuAdapter.fetchOrders(since, creds);
  console.log("fetched:", orders.length);
  for (const o of orders) {
    await saveChannelOrder(o);
    console.log(" saved", o.orderId, "|", o.status, "|", o.items?.map(i => `${i.sku} x${i.quantity}`).join(", "));
  }
  process.exit(0);
}
main();
