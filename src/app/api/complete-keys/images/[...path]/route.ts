import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxy images to avoid CORS issues and handle missing images gracefully
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const imageUrl = path.join('/');

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);

    // Allowlist: only fetch public https images from known asset hosts
    let parsed: URL;
    try {
      parsed = new URL(decodedUrl);
    } catch {
      return NextResponse.redirect(new URL('/images/placeholder-remote-key.png', request.url));
    }
    const ALLOWED_HOSTS = [
      'allremotes.s3.ap-southeast-2.amazonaws.com',
      'www.allremotes.com.au',
      'allremotes.com.au',
      'cdn.shopify.com',
      'i.ebayimg.com',
      'ae01.alicdn.com',
      'images-na.ssl-images-amazon.com',
      'm.media-amazon.com',
    ];
    if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.includes(parsed.hostname) || parsed.username || parsed.password) {
      return NextResponse.redirect(new URL('/images/placeholder-remote-key.png', request.url));
    }

    // Fetch the image from the original source
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      // Return a placeholder image if the original fails
      return NextResponse.redirect(
        new URL('/images/placeholder-remote-key.png', request.url)
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error: any) {
    console.error("Error proxying image:", error);
    // Return placeholder on error
    return NextResponse.redirect(
      new URL('/images/placeholder-remote-key.png', request.url)
    );
  }
}
