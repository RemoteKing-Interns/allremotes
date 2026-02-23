/**
 * Admin CSV upload backend (Node.js + Express)
 *
 * Goals:
 * - Provide an admin page at GET /admin/upload-products
 * - Accept a CSV upload at POST /admin/upload-products
 * - Validate each CSV row and upsert by Product Code (MongoDB if configured; otherwise ../products.json)
 * - Delete the uploaded CSV file after processing
 *
 * Notes:
 * - This project is a Create React App frontend. This server can also serve the
 *   built frontend from ../build (optional).
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');

const express = require('express');
const http = require('http');

const { mongoEnabled, getDb } = require('./mongo');

const app = express();

function loadEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key) continue;
      if (process.env[key] != null && String(process.env[key]).length > 0) continue;
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // Best-effort only.
  }
}

// Load env vars for the backend when running locally (CRA loads its own .env, but Node doesn't).
loadEnvFile(path.resolve(__dirname, '..', '.env'));

// ---- CORS (development convenience) -----------------------------------------
//
// When the website runs on http://localhost:3000 (CRA dev server) and this
// backend runs on http://localhost:3001, the browser considers requests
// cross-origin. Allow localhost dev origins so the admin UI can upload CSVs
// and refresh products without relying on CRA's proxy behavior.
app.use((req, res, next) => {
  const origin = String(req.headers.origin || '');
  const allowed = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  if (allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

// ---- Config -----------------------------------------------------------------

const PORT = Number(process.env.PORT || 3001);
const MAX_HEADER_SIZE = Number(process.env.MAX_HEADER_SIZE || 64 * 1024);

// Store products in a local JSON file (no DB yet).
const PRODUCTS_JSON_PATH = path.resolve(__dirname, '..', 'products.json');

// Uploads are stored temporarily on disk and deleted after processing.
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

const ADMIN_UPLOAD_PAGE_PATH = path.resolve(__dirname, 'upload-products.html');
const CSV_TEMPLATE_PATH = path.resolve(__dirname, 'products-template.csv');

// ---- Helpers ----------------------------------------------------------------

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function ensureProductsFile() {
  try {
    await fsp.access(PRODUCTS_JSON_PATH, fs.constants.F_OK);
  } catch {
    // Create an empty product list if it doesn't exist yet.
    await fsp.writeFile(PRODUCTS_JSON_PATH, JSON.stringify([], null, 2) + '\n', 'utf8');
  }
}

async function readProducts() {
  await ensureProductsFile();
  const raw = await fsp.readFile(PRODUCTS_JSON_PATH, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    // If the JSON becomes corrupted, fail loudly rather than silently destroying data.
    err.message = `Failed to parse products.json: ${err.message}`;
    throw err;
  }
}

async function writeProducts(products) {
  // Write atomically: write to a temp file then rename, to reduce corruption risk.
  const tmpPath = `${PRODUCTS_JSON_PATH}.tmp`;
  await fsp.writeFile(tmpPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
  await fsp.rename(tmpPath, PRODUCTS_JSON_PATH);
}

function normalizeSkuKey(value) {
  return normalizeKeyPart(value).replace(/\s+/g, '');
}

async function getProductsCollection() {
  const db = await getDb();
  const col = db.collection('products');
  await col.createIndex({ id: 1 }, { unique: true });
  await col.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
  return col;
}

async function getContentCollection() {
  const db = await getDb();
  const col = db.collection('content');
  // MongoDB always has a unique index on `_id`; no need to create one.
  return col;
}

async function seedContentDefaultsIfMissing() {
  if (!mongoEnabled()) return;
  const col = await getContentCollection();
  const keys = ['home', 'navigation', 'reviews'];
  for (const key of keys) {
    const existing = await col.findOne({ _id: key });
    if (!existing) {
      await col.insertOne({
        _id: key,
        data: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

async function migrateProductsJsonToMongoIfEmpty() {
  if (!mongoEnabled()) return;
  const col = await getProductsCollection();
  const count = await col.estimatedDocumentCount();
  if (count > 0) return;

  try {
    const products = await readProducts();
    if (!products || products.length === 0) return;
    const nowIso = new Date().toISOString();
    const docs = products
      .filter((p) => p && typeof p === 'object')
      .map((p) => {
        const sku = getProductSkuForKey(p);
        const skuKey = sku ? normalizeSkuKey(sku) : null;
        return {
          ...p,
          id: p.id || crypto.randomUUID(),
          sku: p.sku ?? sku ?? '',
          skuKey: skuKey || undefined,
          updatedAt: p.updatedAt || nowIso,
          createdAt: p.createdAt || nowIso,
        };
      });
    if (docs.length === 0) return;

    // Dedupe by `id`, then by `skuKey` (when present), before inserting.
    const seenIds = new Set();
    const seenSkuKeys = new Set();
    const uniqueDocs = [];
    for (const d of docs) {
      const id = String(d.id || '').trim();
      if (!id) continue;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const skuKey = d.skuKey ? String(d.skuKey) : '';
      if (skuKey) {
        if (seenSkuKeys.has(skuKey)) continue;
        seenSkuKeys.add(skuKey);
      }
      uniqueDocs.push(d);
    }

    if (uniqueDocs.length === 0) return;
    await col.insertMany(uniqueDocs, { ordered: false });
  } catch {
    // Ignore seed failures; server should still start.
  }
}

async function verifyMongoConnectionOrDisable() {
  if (!mongoEnabled()) return false;
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch {
    // If MongoDB is configured but unreachable, fall back to JSON mode.
    process.env.MONGODB_DISABLED = '1';
    return false;
  }
}

function normalizeHeader(header) {
  // Normalize headers so we can accept slightly different exports.
  // Examples supported:
  // - "Product Code" -> "product_code"
  // - "ProductCode" -> "product_code"
  // - "Product Code\r" (Windows) -> "product_code"
  // - With UTF-8 BOM: "\uFEFFProduct Code" -> "product_code"
  let h = String(header || '').trim();
  h = h.replace(/^\uFEFF/, ''); // strip BOM if present
  h = h.toLowerCase();
  // Convert punctuation/whitespace to underscores.
  h = h.replace(/[^a-z0-9]+/g, '_');
  h = h.replace(/^_+|_+$/g, '').replace(/_+/g, '_');

  // Canonicalize common variants to the keys our importer expects.
  const compact = h.replace(/_/g, '');
  switch (compact) {
    case 'productgroupgroupname':
      return 'product_group';
    case 'productcode':
      return 'product_code';
    case 'productdescription':
      return 'product_description';
    case 'productgroup':
      return 'product_group';
    case 'basepack':
      return 'base_pack';
    case 'onhand':
      return 'on_hand';
    case 'sellprice':
      return 'sell_price';
    case 'defaultsellprice':
      return 'default_sell_price';
    case 'imageurl':
      return 'image_url';
    default:
      return h;
  }
}

function normalizeKeyPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function coercePrice(value) {
  // Allow "$12.34" or "12.34". Reject empty/NaN.
  const cleaned = String(value || '').trim().replace(/^\$/, '');
  const price = Number(cleaned);
  return Number.isFinite(price) ? price : NaN;
}

function rowToPublicShape(row) {
  // Keep only relevant values in failure responses (avoid giant objects).
  return {
    product_code: row.product_code,
    product_description: row.product_description,
    product_group: row.product_group,
    sell_price: row.sell_price,
    default_sell_price: row.default_sell_price,
    image_url: row.image_url,
  };
}

/**
 * CSV column mapping requirements (after header normalization):
 * - ProductCode / Product Code -> product_code -> SKU (required)
 * - ProductDescription / Product Description -> product_description -> Name (required)
 * - ProductGroup.GroupName / Product Group -> product_group -> Category (optional)
 * - SellPrice / DefaultSellPrice -> sell_price / default_sell_price -> Price (optional)
 * - ImageUrl -> image_url -> Image URL (optional)
 */
function mapRowToProduct(row) {
  const sku = String(row.product_code || '').trim();
  const name = String(row.product_description || '').trim();

  const groupRaw = String(row.product_group || '').trim();
  let category = groupRaw || null;
  if (groupRaw) {
    const g = groupRaw.toLowerCase();
    if (g.includes('garage') || g.includes('gate')) category = 'garage';
    else if (g.includes('auto') || g.includes('car')) category = 'car';
  }

  const sellPriceRaw = String(row.sell_price || '').trim();
  const defaultSellPriceRaw = String(row.default_sell_price || '').trim();
  const sellPrice = sellPriceRaw ? coercePrice(sellPriceRaw) : null;
  const defaultSellPrice = defaultSellPriceRaw ? coercePrice(defaultSellPriceRaw) : null;
  const price = Number.isFinite(sellPrice) ? sellPrice : (Number.isFinite(defaultSellPrice) ? defaultSellPrice : null);

  const image = String(row.image_url || '').trim();

  const inStock = null;
  const description = name || null;

  // No explicit "Brand" column exists in this CSV export. Keep the UI stable by
  // storing the SKU in `brand` (so the "Brand" field isn't empty).
  const brand = sku || null;

  return { sku, brand, name, category, price, inStock, image, description };
}

function buildSkuKey(sku) {
  return normalizeSkuKey(sku);
}

function validateRow(row, { existingKeys, seenKeysInUpload }) {
  const errors = [];

  const product = mapRowToProduct(row);
  const key = buildSkuKey(product.sku);

  if (!product.sku) errors.push('Missing required field: Product Code');
  if (!product.name) errors.push('Missing required field: Name (Product Description)');

  if (product.price !== null) {
    if (!Number.isFinite(product.price)) {
      errors.push('Price must be a number (SellPrice/DefaultSellPrice)');
    } else if (product.price <= 0) {
      errors.push('Price must be greater than 0 (SellPrice/DefaultSellPrice)');
    }
  }

  if (product.sku && seenKeysInUpload.has(key)) errors.push('Duplicate Product Code in uploaded CSV');

  return {
    ok: errors.length === 0,
    errors,
    key,
    willUpdate: existingKeys.has(key),
    product,
  };
}

function looksLikeSku(value) {
  const v = String(value || '').trim();
  if (!v) return false;
  if (v.length > 80) return false;
  if (/\s/.test(v)) return false;
  return /[0-9]/.test(v) || /[-_]/.test(v);
}

function getProductSkuForKey(product) {
  if (!product || typeof product !== 'object') return '';
  if (product.sku) return String(product.sku);
  if (product.product_code) return String(product.product_code);
  if (looksLikeSku(product.brand)) return String(product.brand);
  return '';
}

// ---- Minimal multipart parser (no extra deps) --------------------------------
//
// We purposefully avoid extra NPM packages here to keep this project easy to run.
// This parser is intentionally small and only supports the one file field we need.

function getMultipartBoundary(contentType) {
  const ct = String(contentType || '');
  const match = ct.match(/boundary=([^;]+)/i);
  if (!match) return null;
  // Boundary may be quoted.
  return match[1].trim().replace(/^"|"$/g, '');
}

function parseContentDisposition(disposition) {
  // Example: form-data; name="csv"; filename="products.csv"
  const out = {};
  const parts = String(disposition || '').split(';').map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const val = part.slice(eq + 1).trim().replace(/^"|"$/g, '');
    out[key] = val;
  }
  return out;
}

function sanitizeFilename(name) {
  return String(name || 'upload.csv')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .slice(0, 180);
}

async function readRequestBody(req, { limitBytes }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('Upload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function extractCsvUploadToDisk(req) {
  const boundary = getMultipartBoundary(req.headers['content-type']);
  if (!boundary) {
    const err = new Error('Expected multipart/form-data with boundary');
    err.statusCode = 400;
    throw err;
  }

  const body = await readRequestBody(req, { limitBytes: 6 * 1024 * 1024 });
  const boundaryBuf = Buffer.from(`--${boundary}`, 'utf8');

  let cursor = 0;
  let found = null;

  while (true) {
    const start = body.indexOf(boundaryBuf, cursor);
    if (start === -1) break;
    const next = body.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (next === -1) break;

    // The part data sits between boundaries.
    let part = body.subarray(start + boundaryBuf.length, next);
    cursor = next;

    // Trim leading CRLF.
    if (part.length >= 2 && part[0] === 13 && part[1] === 10) part = part.subarray(2);

    // Final boundary marker: starts with '--'
    if (part.length >= 2 && part[0] === 45 && part[1] === 45) break;

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n', 'utf8'));
    if (headerEnd === -1) continue;

    const headersRaw = part.subarray(0, headerEnd).toString('utf8');
    const content = part.subarray(headerEnd + 4);

    // Content ends with CRLF before the boundary.
    const contentStripped =
      content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10
        ? content.subarray(0, content.length - 2)
        : content;

    const headerLines = headersRaw.split('\r\n');
    const headers = {};
    for (const line of headerLines) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }

    const cd = parseContentDisposition(headers['content-disposition']);
    if (cd.name !== 'csv') continue;

    const originalname = sanitizeFilename(cd.filename || 'upload.csv');
    if (!String(originalname).toLowerCase().endsWith('.csv')) {
      const err = new Error('Only .csv files are allowed');
      err.statusCode = 400;
      throw err;
    }

    const filepath = path.join(UPLOADS_DIR, `${Date.now()}-${crypto.randomUUID()}-${originalname}`);
    await fsp.writeFile(filepath, contentStripped);
    found = { path: filepath, originalname };
    break;
  }

  if (!found) {
    const err = new Error('Missing file field "csv"');
    err.statusCode = 400;
    throw err;
  }

  return found;
}

// ---- CSV parsing (no extra deps) ---------------------------------------------

function parseCsvText(text) {
  // RFC4180-ish CSV parser:
  // - comma-separated
  // - fields may be quoted with double-quotes
  // - quoted double-quotes are escaped as "" inside a quoted field
  //
  // Change: some exports include a title line before the header, and some use
  // different delimiters. We detect the delimiter from the first non-empty line.
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      // Trim CR from Windows line endings.
      if (row.length === 1 && row[0] === '') {
        row = [];
        continue;
      }
      rows.push(row.map((v) => (typeof v === 'string' ? v.replace(/\r$/, '') : v)));
      row = [];
      continue;
    }

    field += ch;
  }

  // Last line (if not ending in newline).
  if (inQuotes) {
    throw new Error('CSV parse error: unterminated quoted field');
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row.map((v) => (typeof v === 'string' ? v.replace(/\r$/, '') : v)));
  }

  // Drop empty trailing rows.
  while (rows.length > 0 && rows[rows.length - 1].every((c) => String(c || '').trim() === '')) {
    rows.pop();
  }

  return rows;
}

function detectDelimiter(text) {
  // Simple delimiter detection on the first non-empty line (ignoring quoted commas).
  // Common delimiters: comma, semicolon, tab.
  const candidates = [',', ';', '\t'];
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line || line.trim() === '') continue;
    const counts = new Map(candidates.map((d) => [d, 0]));
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      if (!inQuotes && counts.has(ch)) counts.set(ch, counts.get(ch) + 1);
    }
    let best = ',';
    let bestCount = -1;
    for (const [d, c] of counts.entries()) {
      if (c > bestCount) {
        best = d;
        bestCount = c;
      }
    }
    return bestCount > 0 ? best : ',';
  }
  return ',';
}

function rowsToRecords(rows) {
  if (!rows || rows.length === 0) return { records: [], headers: [], headerRowIndex: 0 };

  // Change: some CSVs include a title row before the real header row (e.g. "ProductList(in)").
  // We scan the first few rows for the header that contains the required columns.
  const required = ['product_code', 'product_description'];
  let headerRowIndex = 0;
  const scanLimit = Math.min(rows.length, 25);
  for (let i = 0; i < scanLimit; i += 1) {
    const row = rows[i] || [];
    if (row.length <= 1) continue;
    const normalized = row.map(normalizeHeader);
    const set = new Set(normalized);
    const hasAll = required.every((r) => set.has(r));
    if (hasAll) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (rows[headerRowIndex] || []).map(normalizeHeader);
  const records = [];

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const values = rows[i];
    // Skip completely empty lines.
    if (!values || values.every((c) => String(c || '').trim() === '')) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j += 1) {
      obj[headers[j]] = values[j] ?? '';
    }
    records.push(obj);
  }

  return { records, headers, headerRowIndex };
}

// ---- Routes -----------------------------------------------------------------

app.get('/admin/upload-products', async (req, res) => {
  res.type('html').sendFile(ADMIN_UPLOAD_PAGE_PATH);
});

app.get('/admin/upload-products/template.csv', async (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="products-template.csv"');
  res.type('text/csv').sendFile(CSV_TEMPLATE_PATH);
});

app.get('/api/admin/upload-products/template.csv', async (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="products-template.csv"');
  res.type('text/csv').sendFile(CSV_TEMPLATE_PATH);
});

app.get('/api/products', async (req, res) => {
  // Allows the website UI to load the latest `products.json` without a database.
  // We keep this read-only endpoint intentionally small and predictable.
  try {
    let products;
    if (mongoEnabled()) {
      const col = await getProductsCollection();
      products = await col.find({}).project({ _id: 0 }).toArray();
    } else {
      products = await readProducts();
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.json(products);
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to load products',
      details: err && err.message ? err.message : String(err),
    });
  }
});

app.put('/api/admin/products', express.json({ limit: '8mb' }), async (req, res) => {
  if (!mongoEnabled()) {
    return res.status(400).json({
      error: 'MongoDB is not configured. Set MONGODB_URI.',
    });
  }

  try {
    const list = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'Body must be an array of products.' });
    }

    const col = await getProductsCollection();
    const ops = [];
    const nowIso = new Date().toISOString();

    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue;
      const id = String(raw.id || '').trim() || crypto.randomUUID();
      const sku = String(raw.sku || getProductSkuForKey(raw) || '').trim();
      const skuKey = sku ? normalizeSkuKey(sku) : null;
      const doc = {
        ...raw,
        id,
        sku: sku || '',
        skuKey: skuKey || undefined,
        updatedAt: nowIso,
        createdAt: raw.createdAt || nowIso,
      };
      ops.push({
        updateOne: {
          filter: { id },
          update: { $set: doc },
          upsert: true,
        },
      });
    }

    if (ops.length > 0) {
      await col.bulkWrite(ops, { ordered: false });
    }
    return res.json({ ok: true, saved: ops.length });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to save products',
      details: err && err.message ? err.message : String(err),
    });
  }
});

app.get('/api/content/:key', async (req, res) => {
  if (!mongoEnabled()) {
    return res.status(400).json({ error: 'MongoDB is not configured. Set MONGODB_URI.' });
  }
  try {
    const key = String(req.params.key || '').trim().toLowerCase();
    const allowed = new Set(['home', 'navigation', 'reviews']);
    if (!allowed.has(key)) return res.status(404).json({ error: 'Unknown content key' });
    const col = await getContentCollection();
    const doc = await col.findOne({ _id: key });
    return res.json({ key, data: doc?.data ?? null, updatedAt: doc?.updatedAt ?? null });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to load content',
      details: err && err.message ? err.message : String(err),
    });
  }
});

app.post('/api/content/:key', express.json({ limit: '2mb' }), async (req, res) => {
  if (!mongoEnabled()) {
    return res.status(400).json({ error: 'MongoDB is not configured. Set MONGODB_URI.' });
  }
  try {
    const key = String(req.params.key || '').trim().toLowerCase();
    const allowed = new Set(['home', 'navigation', 'reviews']);
    if (!allowed.has(key)) return res.status(404).json({ error: 'Unknown content key' });
    const col = await getContentCollection();
    const now = new Date().toISOString();
    await col.updateOne(
      { _id: key },
      { $set: { data: req.body ?? null, updatedAt: now } },
      { upsert: true }
    );
    return res.json({ ok: true, key, updatedAt: now });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to save content',
      details: err && err.message ? err.message : String(err),
    });
  }
});

async function handleUploadProductsCsv(req, res) {
  let uploaded;

  let createdCount = 0;
  let updatedCount = 0;
  const failures = [];

  try {
    // Save the uploaded CSV to disk (temporarily), so we can delete it after processing.
    uploaded = await extractCsvUploadToDisk(req);
    const csvText = await fsp.readFile(uploaded.path, 'utf8');

    const rows = parseCsvText(csvText);
    const { records, headers, headerRowIndex } = rowsToRecords(rows);

    if (records.length === 0) {
      return res.status(400).json({
        error: 'CSV contains no data rows',
      });
    }

    // Required columns in the CSV.
    const requiredCols = ['product_code', 'product_description'];
    const headerSet = new Set(headers);
    const missingCols = requiredCols.filter((c) => !headerSet.has(c));
    if (missingCols.length > 0) {
      return res.status(400).json({
        error: 'CSV is missing required headers',
        missingHeaders: missingCols,
        requiredHeaders: requiredCols,
        // Helps with debugging when the CSV includes a title line above the headers.
        foundHeaders: headers,
      });
    }

    let existingProducts = [];
    let existingBySku = new Map();
    const existingKeys = new Set();
    let productsCol = null;

    if (mongoEnabled()) {
      productsCol = await getProductsCollection();
    } else {
      existingProducts = await readProducts();
      existingBySku = new Map(
        existingProducts
          .filter((p) => p && typeof p === 'object')
          .map((p) => [buildSkuKey(getProductSkuForKey(p)), p])
          .filter(([key]) => key !== '')
      );
      for (const k of existingBySku.keys()) existingKeys.add(k);
    }

    const seenKeysInUpload = new Set();

    // Apply all valid rows, then persist once.
    for (let idx = 0; idx < records.length; idx += 1) {
      // Change: header row might not be the first row in the file, so compute the
      // original CSV row number for clearer error reporting.
      const rowNumber = headerRowIndex + 2 + idx;
      const row = records[idx] || {};

      const { ok, errors, product, key } = validateRow(row, {
        existingKeys,
        seenKeysInUpload,
      });

      if (product.sku) seenKeysInUpload.add(key);

      if (!ok) {
        failures.push({
          rowNumber,
          key,
          sku: product.sku || null,
          brand: product.brand || null,
          name: product.name || null,
          errors,
          row: rowToPublicShape(row),
        });
        continue;
      }

      const nowIso = new Date().toISOString();

      // Upsert is based on Product Code (SKU).
      if (mongoEnabled()) {
        const skuKey = normalizeSkuKey(product.sku);
        const result = await productsCol.updateOne(
          { skuKey },
          {
            $set: {
              sku: product.sku,
              skuKey,
              name: product.name,
              category: product.category,
              price: product.price,
              inStock: product.inStock,
              image: product.image,
              description: product.description,
              updatedAt: nowIso,
            },
            // Preserve any existing `brand` if it was manually curated in the UI.
            $setOnInsert: {
              id: crypto.randomUUID(),
              brand: product.brand || product.sku,
              createdAt: nowIso,
            },
          },
          { upsert: true }
        );
        if (result.upsertedCount === 1) createdCount += 1;
        else updatedCount += 1;
      } else if (existingBySku.has(key)) {
        const existing = existingBySku.get(key);
        // Update in place but preserve any fields we don't manage here.
        Object.assign(existing, {
          sku: product.sku,
          // Preserve `brand` if it was manually curated in the UI (CSV doesn't contain a brand column).
          brand: existing.brand || product.brand || product.sku,
          name: product.name,
          category: product.category,
          price: product.price,
          inStock: product.inStock,
          image: product.image,
          description: product.description,
          updatedAt: nowIso,
        });
        updatedCount += 1;
      } else {
        const newProduct = {
          id: crypto.randomUUID(),
          sku: product.sku,
          brand: product.brand || product.sku,
          name: product.name,
          category: product.category,
          price: product.price,
          inStock: product.inStock,
          image: product.image,
          description: product.description,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        existingProducts.push(newProduct);
        existingBySku.set(key, newProduct);
        existingKeys.add(key);
        createdCount += 1;
      }
    }

    if (!mongoEnabled()) {
      // Dedupe any historical duplicates by SKU key (common when the old upsert key included description).
      // Keep the first occurrence we saw in the list (which will have been updated above if present in this upload).
      const finalProducts = [];
      const seenSkuKeys = new Set();
      for (const p of existingProducts) {
        const skuKey = buildSkuKey(getProductSkuForKey(p));
        if (!skuKey) {
          finalProducts.push(p);
          continue;
        }
        if (seenSkuKeys.has(skuKey)) continue;
        seenSkuKeys.add(skuKey);
        finalProducts.push(p);
      }

      await writeProducts(finalProducts);
    }

    return res.json({
      created: createdCount,
      updated: updatedCount,
      failed: failures.length,
      failures,
      totalRows: records.length,
    });
  } catch (err) {
    const statusCode = err && err.statusCode ? Number(err.statusCode) : 500;
    return res.status(statusCode).json({
      error: 'Failed to process CSV upload',
      details: err && err.message ? err.message : String(err),
    });
  } finally {
    // Requirement #8: delete the uploaded CSV file after processing.
    if (uploaded && uploaded.path) {
      try {
        await fsp.unlink(uploaded.path);
      } catch {
        // Ignore: file might already be removed.
      }
    }
  }
}

// HTML admin page posts here (kept for non-React usage).
app.post('/admin/upload-products', handleUploadProductsCsv);

// Website admin UI (React) should post here.
app.post('/api/admin/upload-products', handleUploadProductsCsv);

// Optional: serve the React build when it exists (useful for production).
const buildDir = path.resolve(__dirname, '..', 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  // For client-side routes (React Router), return index.html.
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

// ---- Boot -------------------------------------------------------------------

async function main() {
  await ensureDir(UPLOADS_DIR);
  await ensureProductsFile();
  const mongoOk = await verifyMongoConnectionOrDisable();
  if (!mongoOk && String(process.env.MONGODB_URI || '').trim()) {
    // eslint-disable-next-line no-console
    console.warn('MongoDB configured but unreachable; falling back to products.json/localStorage mode.');
  }
  await seedContentDefaultsIfMissing();
  await migrateProductsJsonToMongoIfEmpty();

  const server = http.createServer({ maxHeaderSize: MAX_HEADER_SIZE }, app);
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Admin CSV upload server running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Upload page: http://localhost:${PORT}/admin/upload-products`);
    // eslint-disable-next-line no-console
    console.log(`MongoDB: ${mongoEnabled() ? 'enabled' : 'disabled'}`);
  });
}

module.exports = { app, main };

// Only start the server when this file is executed directly:
// `node server/index.js`
if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  });
}
