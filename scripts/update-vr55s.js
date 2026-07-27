const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");

    // Fix AR-VR55S with correct SKU
    const vr55s = {
      sku: "AR-VR55S",
      description: `<p>The Vicway VR55S is a genuine 4-button garage door and gate remote control operating on 433MHz frequency with rolling code technology. Designed for Vicway and ProDoor motors, it provides secure reliable control for up to 4 doors or gates.</p>
<p><strong>What's Included:</strong></p>
<ul>
<li>1 x Vicway VR55S Remote Transmitter</li>
<li>1 x CR2032 3V Battery (pre-installed)</li>
<li>Programming Instructions</li>
<li>Keyring Attachment</li>
</ul>`
,
      features: `<ul>
<li>4 Button Transmitter for Vicway and ProDoor garage door openers</li>
<li>Rolling Code Technology for enhanced security</li>
<li>Transmitter Frequency: 433MHz</li>
<li>Control up to 4 doors/gates independently</li>
<li>Compact keyring design</li>
<li>Battery included: CR2032 3V</li>
<li>Australian stock</li>
<li>12-month manufacturer warranty</li>
</ul>`
,
      specification: `<table class="w-full divide-y divide-border">
<thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead>
<tbody>
<tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">Vicway</td></tr>
<tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">VR55S</td></tr>
<tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">433MHz</td></tr>
<tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code</td></tr>
<tr><td class="py-2 px-4">Number of Buttons</td><td class="py-2 px-4">4</td></tr>
<tr><td class="py-2 px-4">Battery</td><td class="py-2 px-4">CR2032 3V</td></tr>
<tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr>
<tr><td class="py-2 px-4">Dimensions</td><td class="py-2 px-4">Approx. 72 x 43 x 16mm</td></tr>
<tr><td class="py-2 px-4">Range</td><td class="py-2 px-4">Up to 100m</td></tr>
<tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months</td></tr>
</tbody>
</table>`
,
      compatibility: `<p>Compatible with the following Vicway and ProDoor garage door and gate motors:</p>
<ul>
<li>✅ Vicway VT380M</li>
<li>✅ Vicway VT1200M</li>
<li>✅ Vicway VR1100M</li>
<li>✅ Vicway VR800M</li>
<li>✅ Vicway VR880M</li>
<li>✅ Vicway VR1800M</li>
<li>✅ Vicway VR900E, VR1000E</li>
<li>✅ Vicway VR900, VR1000, VR1100</li>
<li>✅ Vicway VT380, VT1000, VT1200</li>
<li>✅ ProDoor 900R, 1000R, 1200T, 1500T</li>
<li>✅ Vicway 380G and 390G (original remote must have blue buttons)</li>
</ul>
<p><strong>Note:</strong> This remote must have blue buttons on the original remote for compatibility with Vicway 380G/390G models. If your original remote has white buttons, you may need a different model. Not compatible with motors installed after 2015 if the original remote has blue buttons.</p>`
,
      instructions: `<h3>Programming Instructions</h3>
<p>To program the Vicway VR55S remote to your garage door or gate motor:</p>
<ol>
<li>Ensure your Vicway or ProDoor motor is powered on.</li>
<li>Locate the LEARN / PROGRAM button on your motor's receiver.</li>
<li>Press and release the learn button — the indicator light will activate.</li>
<li>Press and hold the button on the VR55S remote you wish to program for approximately 3 seconds.</li>
<li>The motor will confirm successful programming with an LED flash or beep.</li>
<li>Repeat for each button if controlling multiple doors/gates.</li>
<li>Test each button to confirm proper operation.</li>
</ol>
<p><strong>If the procedure differs between your motor model:</strong></p>
<p>Programming varies depending on your Vicway or ProDoor garage door opener model. Please refer to your motor manual or contact us if you require assistance with programming the VR55S remote.</p>
<h3>⚠️ Important Information</h3>
<ul>
<li>Please confirm your motor model and existing remote type before purchasing.</li>
<li>This remote is designed for Vicway 433MHz rolling code systems.</li>
<li>Not compatible with all Vicway motor models — check the compatibility list above.</li>
<li>If you are unsure which remote you need, contact our team before purchasing.</li>
</ul>`
    };

    const { sku, ...rest } = vr55s;
    const result = await col.updateOne({ sku }, { $set: { ...rest, updatedAt: new Date().toISOString() } });
    console.log(`Updated ${sku}: modifiedCount = ${result.modifiedCount}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
