import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const t = process.env.META_ACCESS_TOKEN!;
  const get = async (p: string) => fetch(`https://graph.facebook.com/v21.0${p}${p.includes("?")?"&":"?"}access_token=${t}`).then(r => r.json());
  const dbg = await get(`/debug_token?input_token=${t}`);
  const scopes = dbg?.data?.scopes || [];
  console.log("ig publish scope:", scopes.includes("instagram_content_publish") ? "YES" : "NO");
  console.log("all scopes:", JSON.stringify(scopes).slice(0, 500));
  if (scopes.includes("instagram_content_publish")) {
    const { postToInstagram } = await import("../src/lib/channels/meta");
    try {
      const r = await postToInstagram({
        imageUrl: "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/AR-RC01-1.png",
        caption: "Tech tip: Most garage remotes pair in under 60 seconds — press the Learn button on your opener motor, then press the button on your new remote. The courtesy light flashes to confirm.\n\nShop compatible remotes: https://www.allremotes.com.au/products/all\n\n#garagedoor #gateremote #smarthome #australia",
      });
      console.log("INSTAGRAM OK:", JSON.stringify(r));
    } catch (e: any) {
      console.log("INSTAGRAM FAIL:", e.message);
    }
  }
  process.exit(0);
})();
