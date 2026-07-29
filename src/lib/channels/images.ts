/**
 * Convert product image URLs to stable public URLs for marketplace feeds.
 * Presigned S3 URLs expire, so prefer a public S3/CloudFront prefix when configured.
 */
export function toPublicImageUrl(url: string): string {
  if (!url) return url;
  const publicPrefix = process.env.NEXT_PUBLIC_IMAGE_PUBLIC_URL || process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!publicPrefix) return url;

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

export function toPublicImageUrls(urls: string[]): string[] {
  return urls.map(toPublicImageUrl);
}
