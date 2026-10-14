import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST { message, link?, imageUrl?, facebook?, instagram? }
// Publishes to the "All Remotes" Facebook Page and/or the linked Instagram
// business account (@all_remotes). Instagram requires imageUrl.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body?.message || "").trim();
    const link = String(body?.link || "").trim() || undefined;
    const imageUrl = String(body?.imageUrl || "").trim() || undefined;
    const toFacebook = body?.facebook !== false;
    const toInstagram = body?.instagram === true;

    if (!message && !imageUrl) {
      return NextResponse.json({ error: "A message or image is required" }, { status: 400 });
    }
    if (!toFacebook && !toInstagram) {
      return NextResponse.json({ error: "Select at least one target" }, { status: 400 });
    }
    if (toInstagram && !imageUrl) {
      return NextResponse.json({ error: "Instagram posts require an image URL" }, { status: 400 });
    }
    if (imageUrl && !/^https:\/\//.test(imageUrl)) {
      return NextResponse.json({ error: "Image URL must be public HTTPS" }, { status: 400 });
    }

    const { postToFacebook, postToInstagram } = await import("@/lib/channels/meta");
    const results: Record<string, { ok: boolean; id?: string; error?: string }> = {};

    if (toFacebook) {
      try {
        const r = await postToFacebook({ message, link, imageUrl });
        results.facebook = { ok: true, id: r?.post_id || r?.id };
      } catch (e: any) {
        results.facebook = { ok: false, error: String(e?.message || e) };
      }
    }
    if (toInstagram) {
      try {
        const caption = link ? `${message}\n\n${link}` : message;
        const r = await postToInstagram({ imageUrl: imageUrl!, caption });
        results.instagram = { ok: true, id: r?.id };
      } catch (e: any) {
        results.instagram = { ok: false, error: String(e?.message || e) };
      }
    }

    const anyOk = Object.values(results).some((r) => r.ok);
    return NextResponse.json({ results }, { status: anyOk ? 200 : 502 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
