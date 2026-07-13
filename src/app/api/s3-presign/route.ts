import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PREFIXES = ["images/", "brands/", "media/", "pdfs/", "hero/"];

function getConfig() {
  const region = process.env.AWS_REGION || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "";
  const configured = Boolean(region && accessKeyId && secretAccessKey && bucket);
  return { region, accessKeyId, secretAccessKey, bucket, configured };
}

export async function GET(request: NextRequest) {
  const config = getConfig();
  if (!config.configured) {
    return NextResponse.json({ error: "S3 is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return NextResponse.json({ error: "Invalid key prefix" }, { status: 400 });
  }

  if (key.includes("..") || key.includes("//") || key.startsWith("/")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const client = new S3Client({
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });

  try {
    const signedUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      { expiresIn: 604800 }
    );
    return NextResponse.json({ signedUrl });
  } catch (err: any) {
    console.error("S3 presign error:", err);
    return NextResponse.json(
      { error: "Failed to sign S3 URL", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
