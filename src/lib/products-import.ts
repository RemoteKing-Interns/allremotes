import crypto from "crypto";

export function normalizeKeyPart(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeSkuKey(value: unknown) {
  return normalizeKeyPart(value).replace(/\s+/g, "");
}

export function normalizeHeader(header: unknown) {
  let h = String(header || "").trim();
  h = h.replace(/^\uFEFF/, "");
  h = h.toLowerCase();
  h = h.replace(/[^a-z0-9]+/g, "_");
  h = h.replace(/^_+|_+$/g, "").replace(/_+/g, "_");

  const compact = h.replace(/_/g, "");
  switch (compact) {
    case "productgroupgroupname":
      return "product_group";
    case "productcode":
      return "product_code";
    case "productdescription":
      return "product_description";
    case "productgroup":
      return "product_group";
    case "basepack":
      return "base_pack";
    case "onhand":
      return "on_hand";
    case "sellprice":
      return "sell_price";
    case "defaultsellprice":
      return "default_sell_price";
    case "imageurl":
      return "image_url";
    default:
      return h;
  }
}

function detectDelimiter(text: string) {
  const candidates = [",", ";", "\t"] as const;
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line || line.trim() === "") continue;
    const counts = new Map<string, number>(candidates.map((d) => [d, 0]));
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      if (!inQuotes && counts.has(ch)) counts.set(ch, (counts.get(ch) || 0) + 1);
    }
    let best = ",";
    let bestCount = -1;
    for (const [d, c] of counts.entries()) {
      if (c > bestCount) {
        best = d;
        bestCount = c;
      }
    }
    return bestCount > 0 ? best : ",";
  }
  return ",";
}

export function parseCsvText(text: string) {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
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
      field = "";
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.length === 1 && row[0] === "") {
        row = [];
        continue;
      }
      rows.push(row.map((v) => (typeof v === "string" ? v.replace(/\r$/, "") : v)));
      row = [];
      continue;
    }

    field += ch;
  }

  if (inQuotes) throw new Error("CSV parse error: unterminated quoted field");
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row.map((v) => (typeof v === "string" ? v.replace(/\r$/, "") : v)));
  }

  while (rows.length > 0 && rows[rows.length - 1].every((c) => String(c || "").trim() === "")) {
    rows.pop();
  }

  return rows;
}

export function rowsToRecords(rows: string[][]) {
  if (!rows || rows.length === 0) return { records: [], headers: [], headerRowIndex: 0 };

  // Support both old format (product_code, product_description) and new format (sku, product_name)
  const oldRequired = ["product_code", "product_description"];
  const newRequired = ["sku", "product_name"];
  let headerRowIndex = 0;
  const scanLimit = Math.min(rows.length, 25);
  
  for (let i = 0; i < scanLimit; i += 1) {
    const row = rows[i] || [];
    if (row.length <= 1) continue;
    const normalized = row.map(normalizeHeader);
    const set = new Set(normalized);
    
    // Check for either old format or new format
    const hasOldFormat = oldRequired.every((r) => set.has(r));
    const hasNewFormat = newRequired.every((r) => set.has(r));
    
    if (hasOldFormat || hasNewFormat) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (rows[headerRowIndex] || []).map(normalizeHeader);
  const records: Record<string, string>[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const values = rows[i];
    if (!values || values.every((c) => String(c || "").trim() === "")) continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j += 1) {
      obj[headers[j]] = String(values[j] ?? "");
    }
    records.push(obj);
  }

  return { records, headers, headerRowIndex };
}

function coercePrice(value: unknown) {
  const cleaned = String(value || "").trim().replace(/^\$/, "");
  const price = Number(cleaned);
  return Number.isFinite(price) ? price : Number.NaN;
}

function rowToPublicShape(row: Record<string, string>) {
  return {
    product_code: row.product_code,
    product_description: row.product_description,
    product_group: row.product_group,
    sell_price: row.sell_price,
    default_sell_price: row.default_sell_price,
    image_url: row.image_url,
  };
}

function findColumnValue(row: Record<string, string>, ...possibleKeys: string[]): string {
  // Try exact matches first, then try flexible matching
  for (const key of possibleKeys) {
    if (row[key]) return String(row[key]).trim();
  }
  // Try substring matching if no exact match (more forgiving for column name variations)
  const rowKeysLower = Object.keys(row).map(k => k.toLowerCase());
  for (const key of possibleKeys) {
    const matchingKey = rowKeysLower.find(rk => rk.includes(key.toLowerCase()));
    if (matchingKey && row[matchingKey]) return String(row[matchingKey]).trim();
  }
  return "";
}

function mapRowToProduct(row: Record<string, string>) {
  // Support both old (product_code) and new (sku) column names
  const sku = findColumnValue(row, "sku", "product_code");
  const name = findColumnValue(row, "product_name", "product_description");
  const brand = findColumnValue(row, "brand") || sku;
  const condition = findColumnValue(row, "condition") || "Brand New";
  const description = findColumnValue(row, "description") || name;

  // Category mapping from new structure or legacy
  const categoryRaw = findColumnValue(row, "category", "product_group");
  let category: string | null = categoryRaw || null;
  if (categoryRaw) {
    const g = categoryRaw.toLowerCase();
    if (g.includes("garage") || g.includes("gate")) category = "garage";
    else if (g.includes("auto") || g.includes("car")) category = "car";
    else category = categoryRaw;
  }

  // Price from new or legacy columns
  const priceRaw = findColumnValue(row, "price_aud", "price", "sell_price", "default_sell_price");
  const price = priceRaw ? coercePrice(priceRaw) : null;

  // In Stock: "Yes" or ✓ = true, anything else = false
  const inStockRaw = findColumnValue(row, "in_stock", "instock").toLowerCase();
  const inStock = inStockRaw === "yes" || inStockRaw === "✓" || inStockRaw === "true" || inStockRaw === "1";

  // Images: collect up to 3 URLs, filter out empty ones
  // Support both "Image 1 URL" (normalizes to image_1_url) and variations
  const images: string[] = [];
  const img1 = findColumnValue(row, "image_1_url", "image1_url", "image_url_1", "image1url", "image_url");
  const img2 = findColumnValue(row, "image_2_url", "image2_url", "image_url_2", "image2url");
  const img3 = findColumnValue(row, "image_3_url", "image3_url", "image_url_3", "image3url");
  if (img1) images.push(img1);
  if (img2) images.push(img2);
  if (img3) images.push(img3);

  // Image index: which image is the primary thumbnail
  const imgIndexRaw = findColumnValue(row, "img_index", "imgindex", "image_index");
  const imgIndex = Number.isFinite(Number(imgIndexRaw)) ? Number(imgIndexRaw) : 0;

  // Fallback to single image for backward compatibility
  const image = images.length > 0 ? images[0] : "";

  return { sku, brand, name, category, price, inStock, description, condition, image, images, imgIndex };
}

function buildSkuKey(sku: string) {
  return normalizeSkuKey(sku);
}

export function looksLikeSku(value: unknown) {
  const v = String(value || "").trim();
  if (!v) return false;
  if (v.length > 80) return false;
  if (/\s/.test(v)) return false;
  return /[0-9]/.test(v) || /[-_]/.test(v);
}

export function getProductSkuForKey(product: any) {
  if (!product || typeof product !== "object") return "";
  if (product.sku) return String(product.sku);
  if (product.product_code) return String(product.product_code);
  if (looksLikeSku(product.brand)) return String(product.brand);
  return "";
}

export async function upsertProductsFromCsvRecords(params: {
  records: Record<string, string>[];
  headers: string[];
  headerRowIndex: number;
  mongo: null | {
    productsCol: {
      updateOne: (filter: any, update: any, options: any) => Promise<{ upsertedCount?: number }>;
    };
  };
  jsonStore: null | {
    read: () => Promise<any[]>;
    write: (products: any[]) => Promise<void>;
  };
}) {
  const { records, headers, headerRowIndex, mongo, jsonStore } = params;

  if (!records || records.length === 0) {
    return { status: 400, body: { error: "CSV contains no data rows" } };
  }

  // Support both old and new column formats
  const oldRequiredCols = ["product_code", "product_description"];
  const newRequiredCols = ["sku", "product_name"];
  const headerSet = new Set(headers);
  
  const hasOldFormat = oldRequiredCols.every((c) => headerSet.has(c));
  const hasNewFormat = newRequiredCols.every((c) => headerSet.has(c));
  
  if (!hasOldFormat && !hasNewFormat) {
    return {
      status: 400,
      body: {
        error: "CSV is missing required headers. Provide either: (product_code AND product_description) OR (sku AND product_name)",
        missingHeaders: oldRequiredCols.some(c => !headerSet.has(c)) ? oldRequiredCols : newRequiredCols,
        foundHeaders: headers,
      },
    };
  }

  let createdCount = 0;
  let updatedCount = 0;
  const failures: any[] = [];

  let existingProducts: any[] = [];
  let existingBySku = new Map<string, any>();
  const existingKeys = new Set<string>();

  if (!mongo) {
    if (!jsonStore) {
      return { status: 400, body: { error: "No datastore configured. Set MONGODB_URI." } };
    }
    existingProducts = await jsonStore.read();
    existingBySku = new Map(
      existingProducts
        .filter((p) => p && typeof p === "object")
        .map((p) => [buildSkuKey(getProductSkuForKey(p)), p] as const)
        .filter(([key]) => key !== "")
    );
    for (const k of existingBySku.keys()) existingKeys.add(k);
  }

  const seenKeysInUpload = new Set<string>();

  for (let idx = 0; idx < records.length; idx += 1) {
    const rowNumber = headerRowIndex + 2 + idx;
    const row = records[idx] || {};

    const product = mapRowToProduct(row);
    const key = buildSkuKey(product.sku);
    const errors: string[] = [];

    if (!product.sku) errors.push("Missing required field: Product Code");
    if (!product.name) errors.push("Missing required field: Name (Product Description)");

    if (product.price !== null) {
      if (!Number.isFinite(product.price)) errors.push("Price must be a number (SellPrice/DefaultSellPrice)");
      else if (Number(product.price) <= 0) errors.push("Price must be greater than 0 (SellPrice/DefaultSellPrice)");
    }

    if (product.sku && seenKeysInUpload.has(key)) errors.push("Duplicate Product Code in uploaded CSV");

    if (product.sku) seenKeysInUpload.add(key);

    if (errors.length > 0) {
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

    if (mongo) {
      const skuKey = normalizeSkuKey(product.sku);
      const result = await mongo.productsCol.updateOne(
        { skuKey },
        {
          $set: {
            sku: product.sku,
            skuKey,
            brand: product.brand || product.sku,
            name: product.name,
            category: product.category,
            price: product.price,
            inStock: product.inStock,
            image: product.image, // Legacy fallback
            images: product.images, // New: array of URLs
            imgIndex: product.imgIndex ?? 0, // New: primary image index
            condition: product.condition, // New: condition field
            description: product.description,
            updatedAt: nowIso,
          },
          $setOnInsert: {
            id: crypto.randomUUID(),
            createdAt: nowIso,
          },
        },
        { upsert: true }
      );
      if (result?.upsertedCount === 1) createdCount += 1;
      else updatedCount += 1;
      continue;
    }

    if (existingBySku.has(key)) {
      const existing = existingBySku.get(key);
      Object.assign(existing, {
        sku: product.sku,
        brand: existing.brand || product.brand || product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        inStock: product.inStock,
        image: product.image, // Legacy fallback
        images: product.images, // New: array of URLs
        imgIndex: product.imgIndex ?? 0, // New: primary image index
        condition: product.condition, // New: condition field
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
        image: product.image, // Legacy fallback
        images: product.images, // New: array of URLs
        imgIndex: product.imgIndex ?? 0, // New: primary image index
        condition: product.condition, // New: condition field
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

  if (!mongo && jsonStore) {
    const finalProducts: any[] = [];
    const seenSkuKeys = new Set<string>();
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
    await jsonStore.write(finalProducts);
  }

  return {
    status: 200,
    body: {
      created: createdCount,
      updated: updatedCount,
      failed: failures.length,
      failures,
      totalRows: records.length,
    },
  };
}

