import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getDb, mongoEnabled } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getConfig() {
  const region = process.env.AWS_REGION || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "";
  const configured = Boolean(region && accessKeyId && secretAccessKey && bucket);
  return { region, accessKeyId, secretAccessKey, bucket, configured };
}

function buildPublicUrl(bucket: string, region: string, key: string) {
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function POST(request: NextRequest) {
  const config = getConfig();
  if (!config.configured) {
    return NextResponse.json({ error: "S3 is not configured" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = String(formData.get("productId") || "").trim();
    const sku = sanitizeFilename(String(formData.get("sku") || productId || "product").trim());

    if (!file || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const client = new S3Client({
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const key = `images/${sku}-ai-${timestamp}.png`;

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000",
      })
    );

    const publicUrl = buildPublicUrl(config.bucket, config.region, key);

    // Persist on the product record: add to images[], set as primary if none set.
    if (!mongoEnabled()) {
      return NextResponse.json(
        { error: "MongoDB is not configured. Image uploads require MongoDB." },
        { status: 503 }
      );
    }

    const db = await getDb();
    const col = db.collection("products");
    const product = await col.findOne({ id: productId });
    const existingImages: string[] = Array.isArray(product?.images) ? product.images : [];
    const images = Array.from(new Set([...existingImages, publicUrl]));
    await col.updateOne(
      { id: productId },
      {
        $set: {
          images,
          image: publicUrl,
          lastUpdated: new Date(),
          lastUpdatedBy: "puter-ai-image",
        },
      }
    );

    return NextResponse.json({ url: publicUrl, key }, { status: 200 });
  } catch (err: any) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload image", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
