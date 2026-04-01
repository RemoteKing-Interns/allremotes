import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotesrk.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getConfig() {
  const region = process.env.AWS_REGION || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  const bucket = process.env.AWS_S3_BUCKET_NAME || "";
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

export async function POST(request: Request) {
  const { region, accessKeyId, secretAccessKey, bucket, configured } = getConfig();
  if (!configured) {
    return NextResponse.json({ error: "S3 not configured" }, { 
      status: 200,
      headers: CORS_HEADERS 
    });
  }

  try {
    const body = await request.json().catch(() => null);
    const filename = String(body?.filename || "").trim();
    const contentType = String(body?.contentType || "").trim();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { 
        status: 400,
        headers: CORS_HEADERS 
      });
    }

    const safeName = sanitizeFilename(filename);
    const key = `hero/${Date.now()}-${safeName}`;

    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const publicUrl = buildPublicUrl(bucket, region, key);

    return NextResponse.json({ presignedUrl, publicUrl, key }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create upload URL", details: err?.message || String(err) },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
