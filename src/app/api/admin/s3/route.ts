import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

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

export async function GET() {
  const { region, accessKeyId, secretAccessKey, bucket, configured } = getConfig();
  if (!configured) {
    return NextResponse.json({ error: "S3 not configured", images: [] }, { 
      status: 200,
      headers: CORS_HEADERS 
    });
  }

  try {
    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new ListObjectsV2Command({ Bucket: bucket });
    const response = await client.send(command);
    const contents = response.Contents || [];

    const images = contents
      .filter((item) => {
        const key = String(item.Key || "").toLowerCase();
        return IMAGE_EXTENSIONS.some((ext) => key.endsWith(ext));
      })
      .map((item) => {
        const key = String(item.Key || "");
        const name = key.split("/").pop() || key;
        return {
          key,
          url: buildPublicUrl(bucket, region, key),
          name,
          size: item.Size ?? 0,
          lastModified: item.LastModified ? item.LastModified.toISOString() : null,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastModified ? Date.parse(a.lastModified) : 0;
        const bTime = b.lastModified ? Date.parse(b.lastModified) : 0;
        return bTime - aTime;
      });

    return NextResponse.json({ images }, {
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to list S3 images", images: [], details: err?.message || String(err) },
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
