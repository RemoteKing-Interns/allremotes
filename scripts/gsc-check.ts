import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { isSearchConsoleConfigured, querySearchAnalytics } = await import("../src/lib/search-console");
  console.log("configured:", isSearchConsoleConfigured());
  const d = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const s = new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0];
  const r = await querySearchAnalytics({ startDate: s, endDate: d, dimensions: ["query"], rowLimit: 5 });
  console.log("clicks:", r.totalClicks, "impressions:", r.totalImpressions, "rows:", r.rows.length);
  process.exit(0);
})();
