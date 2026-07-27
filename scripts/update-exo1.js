const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/";

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db("allremotes");
    const col = db.collection("products");

    const sku = "AR-EXO1";
    const description = `<p>The Dace EXO EXO1 is a genuine 4-button garage door and gate remote transmitter operating on 433MHz frequency with rolling code technology. Designed for use with DACE Ultima series gate and garage automation systems, the EXO1 offers secure, reliable control with a compact, durable design.</p>
<p><strong>What's Included:</strong></p>
<ul>
<li>1 x Genuine Dace EXO EXO1 Remote Transmitter</li>
<li>1 x 23A 12V Battery (pre-installed)</li>
<li>Keyring Loop Attachment</li>
<li>Step-by-step Programming Instructions</li>
</ul>`;

    const features = `<ul>
<li>4 Button Transmitter for DACE Gate and Garage Systems</li>
<li>Rolling Code Technology for enhanced security</li>
<li>Transmitter Frequency: 433.92MHz</li>
<li>Control up to 4 doors/gates independently</li>
<li>Compact design: 58 x 36 x 12mm</li>
<li>Battery included: 23A 12V</li>
<li>Keyring loop attachment included</li>
<li>Australian stock</li>
<li>12-month manufacturer warranty</li>
</ul>`;

    const specification = `<table class="w-full divide-y divide-border">
<thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead>
<tbody>
<tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">Dace</td></tr>
<tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">EXO EXO1 (TM4)</td></tr>
<tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">433.92MHz</td></tr>
<tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code</td></tr>
<tr><td class="py-2 px-4">Number of Buttons</td><td class="py-2 px-4">4 (Green, Blue, Brown, Grey)</td></tr>
<tr><td class="py-2 px-4">Battery</td><td class="py-2 px-4">23A (12V)</td></tr>
<tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr>
<tr><td class="py-2 px-4">Dimensions</td><td class="py-2 px-4">58 x 36 x 12mm</td></tr>
<tr><td class="py-2 px-4">Range</td><td class="py-2 px-4">Up to 100m</td></tr>
<tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months</td></tr>
</tbody>
</table>`;

    const compatibility = `<p>Compatible with the following DACE gate and garage motor systems:</p>
<ul>
<li>✅ DACE Ultima RT 25/50 (Sliding Gate Motor)</li>
<li>✅ DACE Ultima HT 18/36 (Sliding Gate Motor)</li>
<li>✅ All DACE systems using TM4/EXO protocol</li>
</ul>
<p><strong>Note:</strong> The EXO Black Remote is EXO EXO004 and is NOT compatible with grey-button EXO remotes. Please confirm your existing remote model before ordering.</p>`;

    const instructions = `<h3>Programming Instructions</h3>
<p>To program the EXO EXO1 remote to your DACE gate or garage motor:</p>
<ol>
<li>Locate the LEARN / PROGRAM button on your DACE motor or control unit.</li>
<li>Press and release the learn button — the indicator light will activate.</li>
<li>Within the programming window, press and hold the button on the EXO1 remote that you wish to program.</li>
<li>Wait for the motor or control unit to confirm successful programming (indicator light or beep).</li>
<li>Repeat the process for each button if controlling multiple doors/gates.</li>
<li>Test each button to confirm proper operation.</li>
</ol>
<p><strong>Deleting a Remote:</strong></p>
<ol>
<li>Press and hold the learn button on the motor/control unit for approximately 5 seconds until the indicator light flashes.</li>
<li>The stored remote codes will be erased.</li>
<li>Re-program any remotes you wish to keep.</li>
</ol>
<p><strong>If the procedure differs between your motor model:</strong></p>
<p>Programming varies depending on your gate or garage door motor model. Please refer to your motor manual or contact us if you require assistance with programming your EXO1 remote.</p>
<h3>⚠️ Important Information</h3>
<ul>
<li>Please confirm your DACE motor model and existing remote type before purchasing.</li>
<li>The EXO Black Remote (EXO004) is NOT compatible with grey-button EXO remotes — check your existing remote carefully.</li>
<li>If you are unsure which remote or model you need, contact our team before purchasing.</li>
<li>Ensure the battery is correctly installed with the correct polarity before programming.</li>
</ul>
<h3>Why Choose All Remotes?</h3>
<ul>
<li>🇦🇺 Australian owned &amp; operated</li>
<li>🚚 Fast Australia-wide shipping</li>
<li>🔋 Battery included</li>
<li>⭐ Quality tested products</li>
<li>📞 Friendly local support</li>
</ul>`;

    const result = await col.updateOne(
      { sku },
      {
        $set: {
          description,
          features,
          specification,
          compatibility,
          instructions,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    console.log(`Updated ${sku}: modifiedCount = ${result.modifiedCount}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

main();
