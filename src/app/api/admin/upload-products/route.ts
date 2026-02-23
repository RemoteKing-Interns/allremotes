import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { parseCsvText, rowsToRecords, upsertProductsFromCsvRecords } from "@/lib/products-import";
import { readProductsJson, writeProductsJson } from "@/lib/products-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const file = form.get("csv");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing file field "csv"' },
        { status: 400 }
      );
    }

    const name = String(file.name || "upload.csv");
    if (!name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are allowed" }, { status: 400 });
    }

    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload too large" }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const csvText = buf.toString("utf8");

    const rows = parseCsvText(csvText);
    const { records, headers, headerRowIndex } = rowsToRecords(rows);

    let productsCol: any = null;
    if (mongoEnabled()) {
      const db = await getDb();
      productsCol = db.collection("products");
      await productsCol.createIndex({ id: 1 }, { unique: true });
      await productsCol.createIndex({ skuKey: 1 }, { unique: true, sparse: true });
    }

    const jsonStore = productsCol
      ? null
      : {
          read: readProductsJson,
          write: writeProductsJson,
        };

    const result = await upsertProductsFromCsvRecords({
      records,
      headers,
      headerRowIndex,
      mongo: productsCol
        ? {
            productsCol,
          }
        : null,
      jsonStore,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    const msg = err?.message || String(err);
    return NextResponse.json(
      { error: "Failed to process CSV upload", details: msg },
      { status: 500 }
    );
  }
}
