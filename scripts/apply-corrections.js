const { MongoClient } = require('mongodb');
const fs = require('fs');
async function main() {
  const uri = 'mongodb+srv://intern:Z9axiy75zxpxwekF@allremotes.9jdilke.mongodb.net/';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('allremotes');
  const col = db.collection('products');
  
  for (let i = 1; i <= 5; i++) {
    const path = 'scripts/corrections-batch-' + i + '.json';
    if (!fs.existsSync(path)) continue;
    const batch = JSON.parse(fs.readFileSync(path, 'utf-8'));
    const skus = Object.keys(batch);
    for (const sku of skus) {
      const data = batch[sku];
      const update = { $set: {} };
      if (data.title) update.$set.name = data.title;
      if (data.brand) update.$set.brand = data.brand;
      if (data.model) update.$set.model = data.model;
      if (data.frequency) update.$set.frequency = data.frequency;
      if (data.codingType) update.$set.codingType = data.codingType;
      if (data.numberOfButtons) update.$set.numberOfButtons = data.numberOfButtons;
      if (data.battery) update.$set.battery = data.battery;
      if (data.batteryIncluded) update.$set.batteryIncluded = data.batteryIncluded;
      if (data.warranty) update.$set.warranty = data.warranty;
      if (data.dimensions) update.$set.dimensions = data.dimensions;
      if (data.features) update.$set.features = data.features;
      if (data.compatibility) update.$set.compatibility = data.compatibility;
      if (data.instructions) update.$set.instructions = data.instructions;
      const result = await col.updateOne({ sku }, update);
      console.log('Batch ' + i + ': ' + sku + ' -> matched:' + result.matchedCount + ' modified:' + result.modifiedCount);
    }
  }
  await client.close();
}
main();