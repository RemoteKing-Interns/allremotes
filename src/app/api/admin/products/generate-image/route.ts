import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1";
const DEFAULT_MODEL = "agnes-image-2.1-flash";

// Convert an ArrayBuffer to a base64 data URI.
function toDataUri(buffer: ArrayBuffer, contentType: string = "image/png"): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

// Fetch the reference image and return as a data URI.
async function fetchReferenceImage(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference image (status ${res.status})`);
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = await res.arrayBuffer();
  return toDataUri(buffer, contentType);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.AGNES_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing AGNES_AI_API_KEY in environment. Get a free key at https://auth.agnes-ai.com" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || "").trim();
    const imageUrl = String(body?.image || "").trim();
    const ratio = String(body?.ratio || "3:4");
    const size = String(body?.size || "2K");

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const extraBody: Record<string, any> = {
      response_format: "b64_json",
    };

    let refImage: string[] = [];
    if (imageUrl) {
      try {
        refImage = [await fetchReferenceImage(imageUrl)];
        extraBody.image = refImage;
      } catch (err: any) {
        console.error("Reference image fetch failed:", err);
        return NextResponse.json(
          { error: "Failed to fetch reference image", details: err?.message || String(err) },
          { status: 502 }
        );
      }
    }

    const payload: Record<string, any> = {
      model: process.env.AGNES_AI_MODEL || DEFAULT_MODEL,
      prompt,
      size,
      ratio,
      extra_body: extraBody,
    };
    if (refImage.length) {
      payload.image = refImage;
    }

    const res = await fetch(`${AGNES_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Agnes AI error:", res.status, text);
      return NextResponse.json(
        { error: "Image generation failed", details: `Agnes AI status ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "No image returned from Agnes AI" }, { status: 502 });
    }

    const buffer = Buffer.from(b64, "base64");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Generate image error:", err);
    return NextResponse.json(
      { error: "Image generation failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
