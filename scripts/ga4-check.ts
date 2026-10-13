import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { getGA4Dashboard } = await import("../src/lib/google-analytics");
  const d = await getGA4Dashboard(30);
  console.log("summary:", JSON.stringify(d.summary));
  console.log("pages:", d.pages.length, "sources:", d.sources.length, "countries:", d.countries.length);
  process.exit(0);
})();
