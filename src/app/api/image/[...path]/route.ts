import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const S3_BUCKET = "https://allremotes.s3.ap-southeast-2.amazonaws.com";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");
  const s3Url = `${S3_BUCKET}/${filePath}`;

  try {
    const res = await fetch(s3Url);
    if (!res.ok) {
      return NextResponse.redirect(
        new URL("/images/mainlogo.png", _req.url)
      );
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=2592000",
      },
    });
  } catch {
    return NextResponse.redirect(
      new URL("/images/mainlogo.png", _req.url)
    );
  }
}
