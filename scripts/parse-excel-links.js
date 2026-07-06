const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'E:\\allremotes\\complete_keys_by_brand.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Get raw cell data to extract hyperlinks
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const data = [];
  const headers = [];

  // First row = headers
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const cell = sheet[cellAddress];
    headers.push(cell?.v || '');
  }

  // Data rows
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const obj = {};
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddress];
      const header = headers[col - range.s.c];
      
      if (cell) {
        // Check for hyperlink
        if (cell.l && cell.l.Target) {
          obj[header] = cell.l.Target;
        } else {
          obj[header] = cell.v;
        }
      } else {
        obj[header] = null;
      }
    }
    data.push(obj);
  }

  console.log('Total rows:', data.length);
  console.log('Columns:', headers);
  console.log('\nFirst 3 rows with actual URLs:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  // Check image URLs specifically
  console.log('\nFirst 5 image_url values:');
  data.slice(0, 5).forEach((row, i) => {
    console.log(`${i + 1}. image_url:`, row.image_url);
  });

  // Save as JSON
  fs.writeFileSync('E:\\allremotes\\complete_keys_by_brand_with_urls.json', JSON.stringify(data, null, 2));
  console.log('\nSaved to complete_keys_by_brand_with_urls.json');
} catch (err) {
  console.error('Error:', err.message);
}
