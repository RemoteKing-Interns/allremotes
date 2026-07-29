import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET_URL = "https://allremotes.s3.ap-southeast-2.amazonaws.com";

function getS3Key(url: string): string | null {
  if (!url.startsWith(S3_BUCKET_URL)) return null;
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

/**
 * Convert product image URLs to stable public URLs for marketplace feeds.
 * Presigned S3 URLs expire, so prefer a public S3/CloudFront prefix when configured.
 * Falls back to presigning private S3 URLs (bucket has no public read access) so
 * external crawlers (e.g. eBay) can fetch the image.
 */
export async function toPublicImageUrl(url: string): Promise<string> {
  if (!url) return url;
  const publicPrefix = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_URL || process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (publicPrefix) {
    try {
      const parsed = new URL(url);
      // If the URL is already from the public prefix, leave it
      if (parsed.href.startsWith(publicPrefix)) return url;

      // For S3 presigned URLs, extract the object key from the path and rebuild
      // e.g. https://bucket.s3.region.amazonaws.com/key?...
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2) {
        const key = pathParts.slice(1).join("/"); // drop bucket name
        return `${publicPrefix.replace(/\/$/, "")}/${key}`;
      }
      return url;
    } catch {
      return url;
    }
  }

  const key = getS3Key(url);
  if (!key) return url;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  if (!region || !accessKeyId || !secretAccessKey || !bucket) return url;

  try {
    const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: 604800,
    });
  } catch {
    return url;
  }
}

export async function toPublicImageUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(toPublicImageUrl));
}
