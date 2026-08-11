import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfig() {
  const region = process.env.AWS_REGION || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
  const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || "";
  const configured = Boolean(region && accessKeyId && secretAccessKey && bucket);
  return { region, accessKeyId, secretAccessKey, bucket, configured };
}

// Extract the S3 object key from a URL if it points at our bucket, otherwise null.
function extractKey(url: string, bucket: string, region: string): string | null {
  try {
    const u = new URL(url);
    const hosts = [`${bucket}.s3.${region}.amazonaws.com`, `${bucket}.s3.amazonaws.com`];
    if (!hosts.includes(u.hostname)) return null;
    return decodeURIComponent(u.pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") || "";
  const fetchBytes = searchParams.get("fetch") === "1";
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const config = getConfig();
  const key = config.configured ? extractKey(url, config.bucket, config.region) : null;

  let resolvedUrl = url;
  if (key && config.configured) {
    try {
      const client = new S3Client({
        region: config.region,
        credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      });
      resolvedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: 600 }
      );
    } catch (err: any) {
      console.error("Sign image error:", err);
    }
  }

  // Browser fetch() to S3/external URLs can be blocked by CORS (unlike <img> tags).
  // Fetch the bytes here on the server and stream them back to avoid that entirely.
  if (fetchBytes) {
    try {
      const imgRes = await fetch(resolvedUrl);
      if (!imgRes.ok) {
        return NextResponse.json({ error: `Failed to fetch image (status ${imgRes.status})` }, { status: 502 });
      }
      const contentType = imgRes.headers.get("content-type") || "image/png";
      const buffer = await imgRes.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
      });
    } catch (err: any) {
      console.error("Fetch image error:", err);
      return NextResponse.json({ error: "Failed to fetch image", details: err?.message || String(err) }, { status: 502 });
    }
  }

  return NextResponse.json({ signedUrl: resolvedUrl });
}
