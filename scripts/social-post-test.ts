import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { postToFacebook, postToInstagram } = await import("../src/lib/channels/meta");
  const message = "Tech tip: Most garage remotes pair in under 60 seconds — press the Learn button on your opener motor, then press the button on your new remote. The courtesy light flashes to confirm.\n\nNot sure which remote fits your opener? Send us the brand and model on the motor unit and we will match it for you.";
  const link = "https://www.allremotes.com.au/products/all";
  const imageUrl = "https://allremotes.s3.ap-southeast-2.amazonaws.com/images/AR-RC01-1.png";

  try {
    const fb = await postToFacebook({ message, link, imageUrl });
    console.log("FACEBOOK OK:", JSON.stringify(fb));
  } catch (e: any) {
    console.log("FACEBOOK FAIL:", e.message);
  }

  try {
    const caption = `${message}\n\nShop compatible remotes: ${link}\n\n#garagedoor #gateremote #smarthome #australia`;
    const ig = await postToInstagram({ imageUrl, caption });
    console.log("INSTAGRAM OK:", JSON.stringify(ig));
  } catch (e: any) {
    console.log("INSTAGRAM FAIL:", e.message);
  }
  process.exit(0);
})();
