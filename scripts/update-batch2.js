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
        sku: "AR-RSLIM2E",
        name: "Prastel SLIM2E 920MHz Remote Control",
        description: `<p>The Prastel SLIM2E is a genuine 2-channel compact garage door and gate remote control transmitter operating on 920MHz frequency with rolling code technology. Suitable for Ditec Prastel and similar receiver systems, it provides secure reliable control for up to 2 doors or gates with a compact slim design.</p>
<p><strong>What's Included:</strong></p>
<ul>
<li>1 x Prastel SLIM2E Remote</li>
<li>1 x 12V Battery (pre-installed)</li>
<li>Programming Instructions</li>
</ul>`
,
        features: `<ul>
<li>2 Channel Transmitter for Ditec Prastel and similar receivers</li>
<li>Rolling Code Technology for enhanced security</li>
<li>Transmitter Frequency: 920MHz</li>
<li>Slim compact design</li>
<li>Battery included: 12V</li>
<li>Learn to receiver programming</li>
<li>Australian stock</li>
<li>12-month manufacturer warranty</li>
</ul>`
,
        specification: `<table class="w-full divide-y divide-border">
<thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead>
<tbody>
<tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">Ditec</td></tr>
<tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">SLIM2E</td></tr>
<tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">920MHz</td></tr>
<tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code</td></tr>
<tr><td class="py-2 px-4">Number of Channels</td><td class="py-2 px-4">2</td></tr>
<tr><td class="py-2 px-4">Battery</td><td class="py-2 px-4">12V</td></tr>
<tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr>
<tr><td class="py-2 px-4">Programming Method</td><td class="py-2 px-4">Learn to Receiver</td></tr>
<tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months</td></tr>
</tbody>
</table>`
,
        compatibility: `<p>Compatible with Ditec Prastel receiver systems:</p>
<ul>
<li>✅ Ditec Prastel 2 Channel Compact Receiver</li>
<li>✅ Ditec Prastel Receiver Systems</li>
<li>✅ Suitable for Ditec garage door and gate motors using 920MHz frequency</li>
</ul>
<p><strong>Note:</strong> This remote operates on 920MHz frequency. Ensure your receiver is compatible with this frequency. Not suitable for 433MHz or 315MHz systems.</p>`
,
        instructions: `<h3>Programming Instructions</h3>
<p>To program the Prastel SLIM2E remote to your Ditec receiver:</p>
<ol>
<li>Ensure your Ditec receiver is powered on and in learning mode.</li>
<li>Press and hold the learn button on the receiver until the LED indicator activates.</li>
<li>Press the button on the SLIM2E remote you wish to program.</li>
<li>Wait for the receiver to confirm successful learning (LED indicator or beep).</li>
<li>Repeat for the second channel if needed.</li>
<li>Test each button to confirm proper operation.</li>
</ol>
<p><strong>If the procedure differs between your receiver model:</strong></p>
<p>Programming varies depending on your Ditec receiver model. Please refer to your receiver manual or contact us if you require assistance.</p>
<h3>⚠️ Important Information</h3>
<ul>
<li>Please confirm your receiver frequency (920MHz) before purchasing.</li>
<li>This remote is NOT compatible with receivers operating on different frequencies (433MHz, 315MHz, etc.).</li>
<li>If unsure which remote you need, contact our team before purchasing.</li>
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
