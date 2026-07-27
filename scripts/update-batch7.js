const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");

    const updates = [
      {
        sku: "AR-RBT02A",
        description: `<p>The BFT RBT02A is a genuine 2-channel garage door and gate remote transmitter operating on 433MHz frequency with rolling code technology. Designed for BFT automation systems, it provides secure reliable control for up to 2 doors with a compact design.</p>
<p><strong>What's Included:</strong></p>
<ul>
<li>1 x BFT RBT02A Remote Transmitter</li>
<li>1 x CR2032 3V Battery (included)</li>
<li>Programming Instructions</li>
<li>Free Battery</li>
</ul>`
,
        features: `<ul>
<li>2 Button Transmitter for BFT garage door and gate systems</li>
<li>Rolling Code Technology for enhanced security</li>
<li>Transmitter Frequency: 433MHz</li>
<li>Control up to 2 doors/gates independently</li>
<li>Compact, lightweight design (26g)</li>
<li>Battery included: CR2032 3V</li>
<li>Range: 50-100m</li>
<li>Australian stock</li>
<li>12-month manufacturer warranty</li>
</ul>`
,
        specification: `<table class="w-full divide-y divide-border">
<thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead>
<tbody>
<tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">BFT</td></tr>
<tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">RBT02A (Mitto Cool C2)</td></tr>
<tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">433MHz</td></tr>
<tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code</td></tr>
<tr><td class="py-2 px-4">Number of Buttons</td><td class="py-2 px-4">2</td></tr>
<tr><td class="py-2 px-4">Battery</td><td class="py-2 px-4">CR2032 3V</td></tr>
<tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr>
<tr><td class="py-2 px-4">Range</td><td class="py-2 px-4">50-100m</td></tr>
<tr><td class="py-2 px-4">Weight</td><td class="py-2 px-4">26g</td></tr>
<tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months</td></tr>
</tbody>
</table>`
,
        compatibility: `<p>Compatible with BFT garage door and gate automation systems:</p>
<ul>
<li>✅ BFT 0678 receivers</li>
<li>✅ Thalia BT A80 receivers</li>
<li>✅ Thalia BT A80 DUO receivers</li>
<li>✅ BFT Mitto Cool C2 opener systems</li>
<li>✅ BFT garage door and gate motors with 433MHz receivers</li>
</ul>
<p><strong>Note:</strong> Please confirm your BFT system model before purchasing. This remote operates on 433MHz with rolling code technology.</p>`
,
        instructions: `<h3>Programming Instructions</h3>
<p>To program the BFT RBT02A remote to your garage door opener:</p>
<ol>
<li>Ensure your BFT receiver is powered on and in learning mode.</li>
<li>Press and release the learning button on your BFT receiver — the indicator light will activate.</li>
<li>Press and hold the button on the RBT02A remote you wish to program for approximately 3 seconds.</li>
<li>The receiver will confirm successful programming with an LED flash.</li>
<li>Repeat for the second channel if controlling multiple doors.</li>
<li>Test each button to confirm proper operation.</li>
</ol>
<p><strong>If the procedure differs between your system:</strong></p>
<p>Programming varies depending on your BFT garage door opener model. Please refer to your opener manual or contact us if you require assistance.</p>
<h3>⚠️ Important Information</h3>
<ul>
<li>Please confirm your BFT system model before purchasing.</li>
<li>This remote is designed for 433MHz rolling code BFT systems.</li>
<li>If you are unsure which remote you need, contact our team before purchasing.</li>
</ul>`
      },
      {
        sku: "AR-RGS18",
        description: `<p>The Genius RGS18 is a genuine 4-button garage door and gate remote transmitter operating on 434MHz frequency with rolling code technology. Designed for Genius garage door automation systems, it provides secure reliable control for up to 4 doors.</p>
<p><strong>What's Included:</strong></p>
<ul>
<li>1 x Genius RGS18 Remote Transmitter</li>
<li>1 x 23A 12V Battery (pre-installed)</li>
<li>Programming Instructions</li>
<li>Keyring Attachment</li>
</ul>`
,
        features: `<ul>
<li>4 Button Transmitter for Genius garage door and gate systems</li>
<li>Rolling Code Technology for enhanced security</li>
<li>Transmitter Frequency: 434MHz</li>
<li>Control up to 4 doors/gates independently</li>
<li>Compact keyring design</li>
<li>Battery included: 23A 12V</li>
<li>Australian stock</li>
<li>12-month manufacturer warranty</li>
</ul>`
,
        specification: `<table class="w-full divide-y divide-border">
<thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead>
<tbody>
<tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">Genius</td></tr>
<tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">RGS18 (Echo TX4 RC)</td></tr>
<tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">434MHz</td></tr>
<tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code</td></tr>
<tr><td class="py-2 px-4">Number of Buttons</td><td class="py-2 px-4">4</td></tr>
<tr><td class="py-2 px-4">Battery</td><td class="py-2 px-4">23A 12V</td></tr>
<tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr>
<tr><td class="py-2 px-4">Dimensions</td><td class="py-2 px-4">65 x 30 x 15mm</td></tr>
<tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months</td></tr>
</tbody>
</table>`
,
        compatibility: `<p>Compatible with Genius garage door and gate automation systems:</p>
<ul>
<li>✅ Genius Bravo 433MHz receivers (replaced by Echo 4)</li>
<li>✅ Genius RQFZ 433MHz receivers</li>
<li>✅ Genius Echo RP receivers</li>
<li>✅ Genius garage door and gate openers with 434MHz rolling code receivers</li>
<li>✅ FAAC receivers supporting Genius protocol</li>
</ul>
<p><strong>Note:</strong> This remote operates on 434MHz with rolling code technology. The Genius Echo 4 has replaced the older Genius Bravo — ensure your system is compatible.</p>`
,
        instructions: `<h3>Programming Instructions</h3>
<p>To program the Genius RGS18 remote to your garage door opener:</p>
<ol>
<li>Ensure your Genius receiver is powered on and in learning mode.</li>
<li>Press and release the learn button on your Genius receiver — the indicator light will activate.</li>
<li>Press and hold the button on the RGS18 remote you wish to program for approximately 3 seconds.</li>
<li>The receiver will confirm successful programming with an LED flash or beep.</li>
<li>Repeat for each button if controlling multiple doors.</li>
<li>Test each button to confirm proper operation.</li>
</ol>
<p><strong>If the procedure differs between your Genius model:</strong></p>
<p>Programming varies depending on your Genius garage door opener model. Please refer to your Genius receiver manual or contact us if you require assistance with programming the RGS18 remote.</p>
<h3>⚠️ Important Information</h3>
<ul>
<li>Please confirm your Genius system model before purchasing.</li>
<li>This remote is designed for 434MHz rolling code Genius systems.</li>
<li>The Genius Echo 4 has replaced the older Genius Bravo — this is the current model.</li>
<li>If you are unsure which remote you need, contact our team before purchasing.</li>
</ul>`
      },
      {
        sku: "AR-ONE2",
        description: `<p>The Nice ON2E Era One is a genuine 2-button garage door and gate remote transmitter operating on 433.92MHz frequency with rolling code technology. Part of the Nice Era One range, it provides secure reliable control for up to 2 doors or gates.</p>
<p><strong>What's Included:</strong></p>
<ul>
<li>1 x Nice ON2E Remote Transmitter</li>
<li>1 x CR2032 3V Lithium Battery (pre-installed)</li>
<li>Programming Instructions</li>
<li>Keyring Attachment / Wall Mount Support</li>
</ul>`
,
        features: `<ul>
<li>2 Button Transmitter for Nice automation systems</li>
<li>Rolling Code Technology (O-Code, 72-bit) for enhanced security</li>
<li>Transmitter Frequency: 433.92MHz</li>
<li>Control up to 2 doors/gates independently</li>
<li>Compact design: 44 x 55 x 10mm</li>
<li>Battery included: CR2032 3V Lithium</li>
<li>Approx. 2 years battery life (10 transmissions/day)</li>
<li>Australian stock</li>
<li>12-month manufacturer warranty</li>
</ul>`
,
        specification: `<table class="w-full divide-y divide-border">
<thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead>
<tbody>
<tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">Nice</td></tr>
<tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">ON2E Era One</td></tr>
<tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">433.92MHz</td></tr>
<tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code (72-bit O-Code)</td></tr>
<tr><td class="py-2 px-4">Number of Buttons</td><td class="py-2 px-4">2</td></tr>
<tr><td class="py-2 px-4">Battery</td><td class="py-2 px-4">CR2032 3V Lithium</td></tr>
<tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr>
<tr><td class="py-2 px-4">Dimensions</td><td class="py-2 px-4">44 x 55 x 10mm</td></tr>
<tr><td class="py-2 px-4">Weight</td><td class="py-2 px-4">18g</td></tr>
<tr><td class="py-2 px-4">Range</td><td class="py-2 px-4">Up to 200m (outdoor)</td></tr>
<tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months</td></tr>
</tbody>
</table>`
,
        compatibility: `<p>Compatible with Nice automation systems:</p>
<ul>
<li>✅ Nice Opera system receivers</li>
<li>✅ Receivers using FLo-R encoding</li>
<li>✅ Nice O-Box connection interface (MyNice Pro App compatible)</li>
<li>✅ Nice garage door openers with 433.92MHz rolling code receivers</li>
<li>✅ Nice gate automation systems</li>
</ul>
<p><strong>Note:</strong> This remote is compatible with Nice receivers using O-Code and FLo-R coding systems. It can also be programmed via the MyNice Pro App or O-Box interface for advanced functions.</p>`
,
        instructions: `<h3>Programming Instructions</h3>
<p>To program the Nice ON2E Era One remote to your Nice automation system:</p>
<ol>
<li>Ensure your Nice receiver is powered on and in learning mode.</li>
<li>Using a transmitter already enabled in the receiver, press and hold the button to initiate identity code exchange.</li>
<li>Alternatively, via the MyNice Pro App: place the new transmitter near the O-Box interface and enter the receiver certificate.</li>
<li>The receiver will confirm successful pairing.</li>
<li>Repeat for each button if controlling multiple doors/gates.</li>
<li>Test each button to confirm proper operation.</li>
</ol>
<p><strong>If the procedure differs between your Nice model:</strong></p>
<p>Programming varies depending on your Nice automation system model. The ON2E is part of the Era One range with advanced O-Code 72-bit encryption. Please refer to your system manual or contact us if you require assistance.</p>
<h3>⚠️ Important Information</h3>
<ul>
<li>Please confirm your Nice system model and receiver type before purchasing.</li>
<li>This remote is designed for Nice 433.92MHz rolling code (O-Code) systems.</li>
<li>Compatible with receivers using FLo-R encoding as well.</li>
<li>If you are unsure which remote you need, contact our team before purchasing.</li>
</ul>`
      }
    ];

    for (const update of updates) {
      const { sku, ...rest } = update;
      const result = await col.updateOne({ sku }, { $set: { ...rest, updatedAt: new Date().toISOString() } });
      console.log(`Updated ${sku}: modifiedCount = ${result.modifiedCount}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
