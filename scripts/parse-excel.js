const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'E:\\allremotes\\complete_keys_by_brand.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

  console.log('Total rows:', data.length);
  console.log('Columns:', Object.keys(data[0] || {}));
  console.log('\nFirst 3 rows:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  // Save as JSON for reference
  fs.writeFileSync('E:\\allremotes\\complete_keys_by_brand.json', JSON.stringify(data, null, 2));
  console.log('\nSaved to complete_keys_by_brand.json');
} catch (err) {
  console.error('Error:', err.message);
}
