"use client";

import { useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";

export default function SocialComposer() {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [facebook, setFacebook] = useState(true);
  const [instagram, setInstagram] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Record<string, { ok: boolean; id?: string; error?: string }> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", files[0]);
      const res = await fetch("/api/media", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      const url = data?.urls?.[0]?.url;
      if (!url) throw new Error("Upload returned no URL");
      setImageUrl(String(url).split("?")[0]);
    } catch (e: any) {
      setResults({ upload: { ok: false, error: e.message } });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const post = async () => {
    setPosting(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/social/post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, link, imageUrl, facebook, instagram }),
      });
      const j = await res.json();
      if (j.results) {
        setResults(j.results);
      } else {
        setResults({ error: { ok: false, error: j.error || "Post failed" } });
      }
    } catch (e: any) {
      setResults({ error: { ok: false, error: e.message } });
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-neutral-900">Social Composer</h2>
        <p className="text-sm text-neutral-500">Post to the All Remotes Facebook page and Instagram (@all_remotes). Instagram requires an image.</p>
      </div>
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Write your post…"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files)} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <ImagePlus size={15} />
            {uploading ? "Uploading…" : "Upload image"}
          </button>
          <span className="text-xs text-neutral-400">or</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL (https — required for Instagram)"
            className="min-w-[220px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link (optional, e.g. product URL)"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        {imageUrl && /^https:\/\//.test(imageUrl) && (
          <img src={imageUrl} alt="Post preview" className="h-28 w-28 rounded-lg border border-neutral-200 object-cover" />
        )}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <input type="checkbox" checked={facebook} onChange={(e) => setFacebook(e.target.checked)} className="h-4 w-4" />
            Facebook
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <input type="checkbox" checked={instagram} onChange={(e) => setInstagram(e.target.checked)} className="h-4 w-4" />
            Instagram
          </label>
          <button
            onClick={post}
            disabled={posting || uploading || (!message.trim() && !imageUrl.trim()) || (!facebook && !instagram) || (instagram && !imageUrl.trim())}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50"
          >
            <Send size={15} />
            {posting ? "Posting…" : "Post now"}
          </button>
        </div>
        {results && (
          <div className="space-y-1.5 rounded-lg bg-neutral-50 p-3 text-sm">
            {Object.entries(results).map(([target, r]) => (
              <p key={target} className={r.ok ? "text-emerald-700" : "text-red-600"}>
                <b className="capitalize">{target}:</b>{" "}
                {r.ok ? `Posted ✓ ${r.id ? `(id ${r.id})` : ""}` : `Failed — ${r.error}`}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
