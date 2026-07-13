import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  txt: "text/plain",
  json: "application/json",
  csv: "text/csv",
};

function getMimeType(ext: string) {
  return MIME_MAP[ext.toLowerCase()] || "application/octet-stream";
}

interface MediaItem {
  key: string;
  url: string;
  signedUrl: string;
  size: number;
  lastModified: string;
  type: string;
  kind: string;
  extension: string;
}

function getFileKind(key: string, ext: string) {
  if (key.endsWith("/")) return "folder";
  const e = ext.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico"].includes(e)) return "image";
  if (["mp4", "webm", "ogg", "ogv", "mov", "mkv"].includes(e)) return "video";
  if (["mp3", "wav", "m4a", "ogg", "oga", "flac"].includes(e)) return "audio";
  if (e === "pdf") return "pdf";
  return "other";
}

function getExtension(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

function topLevelFolder(key: string) {
  const slashIndex = key.indexOf("/");
  if (slashIndex === -1) return null;
  return key.slice(0, slashIndex + 1);
}

export async function GET(request: NextRequest) {
  const config = getConfig();
  if (!config.configured) {
    return NextResponse.json({ configured: false, items: [] }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || undefined;

  const client = new S3Client({
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1000,
      ContinuationToken: token,
    });
    const result = await client.send(command);

    const rawItems = await Promise.all(
      (result.Contents || []).map(async (obj) => {
        const key = obj.Key || "";
        const ext = getExtension(key);
        const kind = getFileKind(key, ext);
        const lastModified = obj.LastModified;
        const cacheBuster = lastModified ? lastModified.getTime() : Date.now();
        const publicUrl = `${buildPublicUrl(config.bucket, config.region, key)}?v=${cacheBuster}`;
        const signedUrl =
          kind === "folder"
            ? publicUrl
            : await getSignedUrl(
                client,
                new GetObjectCommand({ Bucket: config.bucket, Key: key }),
                { expiresIn: 604800 }
              );
        return {
          key,
          url: publicUrl,
          signedUrl,
          size: obj.Size || 0,
          lastModified: lastModified?.toISOString() || new Date().toISOString(),
          type: kind === "folder" ? "folder" : getMimeType(ext),
          kind,
          extension: ext,
        };
      })
    );

    // Derive top-level folders from file keys so prefixes like brands/, images/, pdfs/ are shown
    const seen = new Set(rawItems.map((i) => i.key));
    const folders: MediaItem[] = [];
    const folderSet = new Set<string>();
    for (const item of rawItems) {
      const folder = topLevelFolder(item.key);
      if (!folder || seen.has(folder) || folderSet.has(folder)) continue;
      folderSet.add(folder);
      const publicUrl = `${buildPublicUrl(config.bucket, config.region, folder)}?v=${Date.now()}`;
      folders.push({
        key: folder,
        url: publicUrl,
        signedUrl: publicUrl,
        size: 0,
        lastModified: new Date().toISOString(),
        type: "folder",
        kind: "folder",
        extension: "",
      });
    }

    const items = [...folders, ...rawItems];

    return NextResponse.json(
      {
        configured: true,
        items,
        isTruncated: result.IsTruncated || false,
        nextToken: result.NextContinuationToken || null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("List media error:", err);
    return NextResponse.json(
      { error: "Failed to list media", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const config = getConfig();
  if (!config.configured) {
    return NextResponse.json({ error: "S3 is not configured" }, { status: 503 });
  }

  const MAX_SIZE = 50 * 1024 * 1024;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f) => {
      return typeof f === "object" && f !== null && "arrayBuffer" in f && "name" in f;
    }) as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const client = new S3Client({
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });

    const uploaded: any[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max is 50MB.` },
          { status: 400 }
        );
      }

      const safeName = sanitizeFilename(file.name);
      const ext = getExtension(safeName);
      const key = `media/${safeName}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const contentType = file.type || getMimeType(ext);
      const timestamp = Date.now();

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: "no-cache, no-store, must-revalidate",
          Metadata: { "upload-timestamp": timestamp.toString() },
        })
      );

      const publicUrl = `${buildPublicUrl(config.bucket, config.region, key)}?v=${timestamp}`;
      const signedUrl = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: config.bucket, Key: key }),
        { expiresIn: 604800 }
      );

      uploaded.push({
        key,
        url: publicUrl,
        signedUrl,
        size: file.size,
        type: contentType,
        kind: getFileKind(key, ext),
        extension: ext,
      });
    }

    return NextResponse.json({ urls: uploaded }, { status: 200 });
  } catch (err: any) {
    console.error("Upload media error:", err);
    return NextResponse.json(
      { error: "Failed to upload media", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const config = getConfig();
  if (!config.configured) {
    return NextResponse.json({ error: "S3 is not configured" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => null);
    const key = String(body?.key || "").trim();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const client = new S3Client({
      region: config.region,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });

    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete media error:", err);
    return NextResponse.json(
      { error: "Failed to delete media", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
