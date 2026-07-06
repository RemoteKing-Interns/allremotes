const fs = require('fs');

const keysData = JSON.parse(fs.readFileSync('E:\\allremotes\\complete_keys_by_brand_with_urls.json', 'utf8'));

console.log(`Importing ${keysData.length} keys...`);

fetch('http://localhost:3000/api/complete-keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ keys: keysData }),
})
  .then(res => res.json())
  .then(data => {
    console.log('Import result:', data);
  })
  .catch(err => {
    console.error('Import failed:', err);
  });
