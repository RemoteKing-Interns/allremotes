const { MongoClient } = require('mongodb');
async function main() {
  const uri = process.argv[2];
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('allremotes');
  const col = db.collection('products');
  const sku = 'AR-RKO43-ORA';
  const description = '<p>The Key Automation SUB44R is a 4-button garage door and gate remote transmitter operating on 433MHz rolling code technology. Designed for Key Automation gate automation systems, it provides secure control for up to 4 doors or gates.</p><p><strong>What\'s Included:</strong></p><ul><li>1 x Key Automation SUB44R Remote Transmitter</li><li>Battery Included</li><li>Programming Instructions</li><li>Key Ring Attachment</li></ul>';
  const features = '<ul><li>433 MHz Rolling Code Technology for secure operation</li><li>4-Button Control for up to 4 doors or gates independently</li><li>Compact, durable design</li><li>Battery included</li><li>Australian stock</li><li>12-month manufacturer warranty</li></ul>';
  const specification = '<table class="w-full divide-y divide-border"><thead><tr><th class="py-2 px-4 text-left font-semibold">Specification</th><th class="py-2 px-4 text-left font-semibold">Details</th></tr></thead><tbody><tr><td class="py-2 px-4">Brand</td><td class="py-2 px-4">Key Automation</td></tr><tr><td class="py-2 px-4">Model</td><td class="py-2 px-4">SUB44R</td></tr><tr><td class="py-2 px-4">Frequency</td><td class="py-2 px-4">433 MHz</td></tr><tr><td class="py-2 px-4">Coding Type</td><td class="py-2 px-4">Rolling Code</td></tr><tr><td class="py-2 px-4">Number of Buttons</td><td class="py-2 px-4">4</td></tr><tr><td class="py-2 px-4">Battery Included</td><td class="py-2 px-4">Yes</td></tr><tr><td class="py-2 px-4">Warranty</td><td class="py-2 px-4">12 Months (Manufacturer)</td></tr></tbody></table>';
  const compatibility = '<p>Compatible with the following Key Automation systems:</p><ul><li>Key Automation garage door openers and gate motors</li><li>Receivers supporting Key Automation rolling code protocol</li></ul>';
  const instructions = '<p><b><u>Programming Instructions:</u></b></p><ol><li>Ensure your Key Automation receiver is powered on and in learning mode.</li><li>Locate the LEARN / PROGRAM button on your garage door opener motor unit.</li><li>Press and release the learn button — the indicator light activates.</li><li>Press and hold the button on the SUB44R remote for approximately 3 seconds.</li><li>The receiver will confirm successful programming with an LED flash or beep.</li><li>Release the transmitter button.</li><li>Test each button to confirm proper operation.</li></ol><p><strong>Important:</strong> • Please check your Key Automation opener model before ordering. • The appearance of your existing remote does not always determine compatibility. • Incorrect frequency selection may result in the remote not working. • If unsure, contact our team before purchasing.</p>';
  const result = await col.updateOne(
    { sku },
    {
      $set: {
        name: 'Key Automation SUB44R 433MHz 4Button Transmitter',
        description,
        features,
        specification,
        compatibility,
        instructions
      }
    }
  );
  console.log(JSON.stringify({ sku, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }, null, 2));
  await client.close();
}
main();