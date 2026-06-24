const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const excelPath = path.join(__dirname, '../public/Gararge and Gate RK data.xlsx');
const workbook = xlsx.readFile(excelPath);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = xlsx.utils.sheet_to_json(worksheet);

console.log(`Found ${data.length} rows in Excel file`);

// Log column names from first row
if (data.length > 0) {
  console.log('Column names:', Object.keys(data[0]));
}

// Extract RK_SKU and RK_URL
const rkData = data.map(row => ({
  rk_sku: row['RK-SKU'],
  rk_url: row['RK_url'],
  sku: row['sku']
})).filter(row => row.rk_sku && row.sku);

console.log(`Found ${rkData.length} rows with RK_SKU and SKU`);

// Load existing products
const productsPath = path.join(__dirname, '../public/allremotes.products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

console.log(`Loaded ${products.length} products from database`);

// Match and update products
let updatedCount = 0;
const updatedProducts = products.map(product => {
  const rkMatch = rkData.find(r => r.sku === product.sku);
  if (rkMatch) {
    updatedCount++;
    console.log(`Updating product: ${product.sku} -> RK_SKU: ${rkMatch.rk_sku}, RK_URL: ${rkMatch.rk_url}`);
    return {
      ...product,
      rk_sku: rkMatch.rk_sku,
      rk_url: rkMatch.rk_url
    };
  }
  return product;
});

console.log(`Updated ${updatedCount} products`);

// Save updated products
fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2), 'utf8');
console.log('Saved updated products to allremotes.products.json');

// Log unmatched SKUs
const matchedSkus = new Set(rkData.map(r => r.sku));
const unmatched = rkData.filter(r => !matchedSkus.has(r.sku));
if (unmatched.length > 0) {
  console.log('\nUnmatched Excel SKUs:');
  unmatched.forEach(r => console.log(`  SKU: ${r.sku}, RK_SKU: ${r.rk_sku}`));
}
