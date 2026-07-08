import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const runtime = "nodejs";

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

async function saveToLocal(formData: FormData, productId: string | null) {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop() || "jpg";
  const safeName = sanitizeFilename(file.name);
  const dir = productId ? `uploads/products/${productId}` : "uploads/products";
  const filename = safeName;
  const fullDir = path.join(process.cwd(), "public", dir);
  const fullPath = path.join(fullDir, filename);

  if (!existsSync(fullDir)) {
    await mkdir(fullDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(fullPath, buffer);

  return {
    success: true,
    url: `/${dir}/${filename}`,
    key: `${dir}/${filename}`,
    size: file.size,
    type: file.type,
    storage: "local",
  };
}

export async function POST(request: NextRequest) {
  const config = getConfig();

  console.log("Upload config check:", { region: config.region, bucket: config.bucket, configured: config.configured });

  if (!config.configured) {
    console.error("S3 not configured. Missing:", {
      region: config.region ? "set" : "missing",
      accessKeyId: config.accessKeyId ? "set" : "missing",
      secretAccessKey: config.secretAccessKey ? "set" : "missing",
      bucket: config.bucket ? "set" : "missing",
    });
    return NextResponse.json(
      { error: "S3 not configured. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;
    const type = formData.get("type") as string | null; // 'product' or 'brand'
    const brandName = formData.get("brandName") as string | null;

    console.log("Upload request received:", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      type,
      brandName,
      productId,
    });

    if (!file) {
      console.error("Upload validation failed: No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      console.error("Upload validation failed: Invalid file type:", file.type);
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only JPEG, PNG, GIF, WebP, and PDF are allowed.` },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error("Upload validation failed: File too large:", file.size);
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.` },
        { status: 400 }
      );
    }

    // Generate filename based on type
    const ext = file.name.split(".").pop() || "jpg";
    const safeName = sanitizeFilename(file.name);
    const isPdf = file.type === "application/pdf";
    
    let key: string;
    if (type === 'brand' && brandName) {
      // Store brand images in brands folder
      const safeBrandName = brandName.replace(/[^a-zA-Z0-9_-]+/g, "_").toLowerCase();
      key = `brands/${safeBrandName}.${ext}`;
    } else {
      // Default: product images
      const basePath = isPdf ? "pdfs" : "images";
      key = `${basePath}/${safeName}`;
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const client = new S3Client({
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "no-cache, no-store, must-revalidate",
      Metadata: {
        "upload-timestamp": Date.now().toString(),
      },
    });

    console.log("Uploading to S3:", { bucket: config.bucket, key, type: file.type, size: file.size });

    await client.send(command);

    console.log("S3 upload successful:", { key });

    // Return the public URL with cache-busting timestamp
    const timestamp = Date.now();
    const url = `${buildPublicUrl(config.bucket, config.region, key)}?v=${timestamp}`;

    return NextResponse.json({
      success: true,
      url,
      key,
      size: file.size,
      type: file.type,
      storage: "s3",
      timestamp,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file to S3", details: error?.message, stack: error?.stack },
      { status: 500 }
    );
  }
}
