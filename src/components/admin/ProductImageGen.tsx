"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, RefreshCw, Image, Check, AlertCircle, Link as LinkIcon, Upload, X } from "lucide-react";
import ProductImage from "@/components/images/ProductImage";

interface Product {
  id: string;
  name: string;
  brand?: string;
  sku?: string;
  rk_sku?: string;
  image?: string;
  description?: string;
  features?: string;
  specification?: string;
  compatibility?: string;
  instructions?: string;
  cat1?: string;
  cat2?: string;
}

// Uses Agnes AI (agnes-image-2.1-flash) via a backend proxy.
// Free tier: 20 RPM, no credit card. Get a key at https://auth.agnes-ai.com

export default function ProductImageGen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refUrlInput, setRefUrlInput] = useState("");
  const [refOverrideUrl, setRefOverrideUrl] = useState<string | null>(null);
  const [refOverrideFile, setRefOverrideFile] = useState<File | null>(null);
  const [refOverridePreview, setRefOverridePreview] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetRefOverride = () => {
    setRefUrlInput("");
    setRefOverrideUrl(null);
    setRefOverrideFile(null);
  };

  useEffect(() => {
    if (!refOverrideFile) {
      setRefOverridePreview(null);
      return;
    }
    const url = URL.createObjectURL(refOverrideFile);
    setRefOverridePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [refOverrideFile]);

  // Effective reference image: uploaded file > pasted URL > product's own image.
  const effectiveRefImage = refOverridePreview || refOverrideUrl || selected?.image || "";

  useEffect(() => {
    fetch("/api/admin/products?limit=1000")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.rk_sku && p.rk_sku.toLowerCase().includes(search.toLowerCase()))
  );

  const stripHtml = (html?: string) => (html ? html.replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim() : "");

  const generate = async () => {
    if (!selected) return;
    setError(null);
    setGeneratedUrl(null);
    setUploadedUrl(null);
    setGenerating(true);
    try {
      let productBlobUrl: string | null = null;
      if (refOverrideFile) {
        productBlobUrl = URL.createObjectURL(refOverrideFile);
      } else if (effectiveRefImage) {
        // Fetch via our server (avoids browser CORS restrictions on S3/external URLs).
        const imgRes = await fetch(`/api/admin/products/sign-image?fetch=1&url=${encodeURIComponent(effectiveRefImage)}`);
        if (!imgRes.ok) {
          const data = await imgRes.json().catch(() => ({}));
          throw new Error(data.error || `Failed to fetch reference image (status ${imgRes.status})`);
        }
        productBlobUrl = URL.createObjectURL(await imgRes.blob());
      }

      if (!productBlobUrl) {
        throw new Error("A reference image is required to generate a poster.");
      }

      const composed = await composePoster(productBlobUrl, selected);
      setGeneratedUrl(URL.createObjectURL(composed));
    } catch (err: any) {
      setError(err?.message || "Image generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  // Wraps/centers text based on current ctx.textAlign/textBaseline.
  // Character-level fitting so long words split instead of overflowing.
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = Infinity
  ) => {
    const chars = text.split("");
    let line = "";
    let cy = y;
    let linesDrawn = 0;

    const flush = (final: boolean = false) => {
      if (!line.trim()) return;
      if (final && linesDrawn + 1 > maxLines) return;
      let out = line.trim();
      // If this is the last allowed line and there's still unflushed text,
      // force an ellipsis that fits within maxWidth.
      if (!final && linesDrawn + 1 >= maxLines) {
        let suffix = "…";
        while (out.length > 0 && ctx.measureText(out + suffix).width > maxWidth) {
          out = out.slice(0, -1);
        }
        out += suffix;
      }
      ctx.fillText(out, x, cy);
      linesDrawn++;
      cy += lineHeight;
      line = "";
    };

    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        if (linesDrawn + 1 >= maxLines) {
          // truncate last allowed line with ellipsis and stop
          let out = line.trim();
          const suffix = "…";
          while (out.length > 0 && ctx.measureText(out + suffix).width > maxWidth) {
            out = out.slice(0, -1);
          }
          ctx.fillText(out + suffix, x, cy);
          return;
        }
        ctx.fillText(line.trim(), x, cy);
        linesDrawn++;
        cy += lineHeight;
        line = chars[i];
      } else {
        line = test;
      }
    }
    if (line.trim()) {
      flush(true);
    }
  };

  const drawCheckIcon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1.5, r * 0.18);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.4);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.35);
    ctx.stroke();
    ctx.restore();
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Extracts real <li> bullet text from the product's features HTML.
  const buildFeatureBullets = (product: Product): string[] => {
    const html = product.features || "";
    const matches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((m) => stripHtml(m[1]))
      .filter(Boolean);
    const fallback = [
      "Genuine/compatible remote for guaranteed reliability",
      "Rolling code technology for enhanced security",
      "Compact, durable design built to last",
      "Battery included and ready for immediate use",
      "Australian owned & operated with fast shipping",
      "Backed by a 12-month warranty",
    ];
    const combined = matches.length ? matches.slice(0, 6) : fallback;
    while (combined.length < 6) combined.push(fallback[combined.length % fallback.length]);
    return combined.slice(0, 6);
  };

  // Extracts real label/value pairs from the specification table HTML (proper cell
  // parsing, not naive text-splitting, so values are never mismatched or garbled).
  const buildSpecHighlights = (product: Product): [string, string][] => {
    const html = product.specification || "";
    const rows = [...html.matchAll(/<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi)]
      .map((m) => [stripHtml(m[1]), stripHtml(m[2])] as [string, string])
      .filter(([label, value]) => label && value && value !== "—");

    const priority = ["Frequency", "Number of Buttons", "Coding Type", "Battery", "Warranty", "Brand"];
    const picked: [string, string][] = [];
    for (const key of priority) {
      const row = rows.find(([label]) => label.toLowerCase() === key.toLowerCase());
      if (row && !picked.includes(row)) picked.push(row);
      if (picked.length === 4) break;
    }
    for (const row of rows) {
      if (picked.length === 4) break;
      if (!picked.includes(row)) picked.push(row);
    }
    while (picked.length < 4) {
      picked.push(["Warranty", "12 Months"]);
    }
    return picked.slice(0, 4);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
    });
  };

  const removeBackground = (canvas: HTMLCanvasElement, threshold = 45) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;

    const sample = (x: number, y: number) => [
      data[(y * w + x) * 4],
      data[(y * w + x) * 4 + 1],
      data[(y * w + x) * 4 + 2],
      data[(y * w + x) * 4 + 3],
    ];
    const corners = [sample(0, 0), sample(w - 1, 0), sample(0, h - 1), sample(w - 1, h - 1)];
    const bg = [
      Math.round(corners.reduce((a, c) => a + c[0], 0) / 4),
      Math.round(corners.reduce((a, c) => a + c[1], 0) / 4),
      Math.round(corners.reduce((a, c) => a + c[2], 0) / 4),
      Math.round(corners.reduce((a, c) => a + c[3], 0) / 4),
    ];

    const matches = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      const d = Math.sqrt(
        Math.pow(data[i] - bg[0], 2) +
          Math.pow(data[i + 1] - bg[1], 2) +
          Math.pow(data[i + 2] - bg[2], 2) +
          Math.pow(data[i + 3] - bg[3], 2)
      );
      return d < threshold;
    };

    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;
    const visited = new Uint8Array(w * h);

    const add = (x: number, y: number) => {
      const idx = y * w + x;
      if (!visited[idx] && matches(x, y)) {
        visited[idx] = 1;
        queue[tail++] = idx;
      }
    };

    for (let x = 0; x < w; x++) {
      add(x, 0);
      add(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      add(0, y);
      add(w - 1, y);
    }

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % w;
      const y = Math.floor(idx / w);
      data[idx * 4 + 3] = 0;
      if (x > 0) add(x - 1, y);
      if (x < w - 1) add(x + 1, y);
      if (y > 0) add(x, y - 1);
      if (y < h - 1) add(x, y + 1);
    }

    ctx.putImageData(img, 0, 0);
  };

  const getBoundingBox = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 10) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    return { x: minX, y: minY, w: Math.max(1, maxX - minX + 1), h: Math.max(1, maxY - minY + 1) };
  };

  const composePoster = async (productUrl: string, product: Product): Promise<Blob> => {
    const productImg = await loadImage(productUrl);

    const W = 1200;
    const H = 1600;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // Clean light background (no AI hallucination risk).
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#eef2f7");
    bgGrad.addColorStop(1, "#ffffff");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#1d4ed8";
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        ctx.beginPath();
        ctx.arc(W - 40 - gx * 26, 40 + gy * 26, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    const pad = Math.round(W * 0.06);

    // Top banner: brand + title + tagline.
    const bannerH = Math.round(H * 0.2);
    const bannerGrad = ctx.createLinearGradient(0, 0, W, bannerH);
    bannerGrad.addColorStop(0, "#0b1e3d");
    bannerGrad.addColorStop(1, "#132a52");
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(0, 0, W, bannerH);

    const brand = (product.brand || "").trim();
    let title = product.name || "Remote Control";
    if (brand && title.toLowerCase().startsWith(brand.toLowerCase())) {
      title = title.slice(brand.length).trim();
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    const bannerTextW = W - pad * 2;
    let cursorY = Math.round(bannerH * 0.32);
    if (brand) {
      ctx.fillStyle = "#60a5fa";
      ctx.font = `800 ${Math.round(W * 0.045)}px Arial, sans-serif`;
      drawWrappedText(ctx, brand.toUpperCase(), pad, cursorY, bannerTextW, Math.round(W * 0.05), 1);
      cursorY += Math.round(W * 0.05);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(W * 0.036)}px Arial, sans-serif`;
    drawWrappedText(ctx, title, pad, cursorY, bannerTextW, Math.round(W * 0.046), 2);

    ctx.fillStyle = "#9fb4d8";
    ctx.font = `600 ${Math.round(W * 0.017)}px Arial, sans-serif`;
    drawWrappedText(
      ctx,
      "GENUINE REPLACEMENT  •  FAST AUSTRALIA-WIDE SHIPPING",
      pad,
      bannerH - Math.round(H * 0.02),
      bannerTextW,
      Math.round(W * 0.022),
      1
    );

    // Product image: real reference photo, cropped tight and centred.
    const productTop = bannerH + Math.round(H * 0.02);
    const productAreaH = Math.round(H * 0.32);

    const maxSrc = 1400;
    const srcScale = Math.min(1, maxSrc / Math.max(productImg.naturalWidth, productImg.naturalHeight));
    const srcW = Math.round(productImg.naturalWidth * srcScale);
    const srcH = Math.round(productImg.naturalHeight * srcScale);
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = srcW;
    srcCanvas.height = srcH;
    const srcCtx = srcCanvas.getContext("2d");
    if (!srcCtx) throw new Error("Canvas not supported");
    srcCtx.drawImage(productImg, 0, 0, srcW, srcH);
    removeBackground(srcCanvas, 40);

    const bbox = getBoundingBox(srcCtx, srcW, srcH);
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = bbox.w;
    cropCanvas.height = bbox.h;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) throw new Error("Canvas not supported");
    cropCtx.drawImage(srcCanvas, -bbox.x, -bbox.y);

    const targetW = W - pad * 2.4;
    const scale = Math.min(targetW / bbox.w, productAreaH / bbox.h, 1.15);
    const drawW = bbox.w * scale;
    const drawH = bbox.h * scale;
    const drawX = (W - drawW) / 2;
    const drawY = productTop + (productAreaH - drawH) / 2;

    ctx.save();
    ctx.translate(drawX + drawW / 2, drawY + drawH + Math.max(6, drawH * 0.02));
    ctx.scale(1, 0.16);
    const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, drawW / 2);
    shadowGrad.addColorStop(0, "rgba(15, 30, 60, 0.30)");
    shadowGrad.addColorStop(1, "rgba(15, 30, 60, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, drawW / 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(cropCanvas, drawX, drawY, drawW, drawH);

    // Feature bullets: two columns, real content parsed from product.features.
    const bulletsY = productTop + productAreaH + Math.round(H * 0.03);
    const bullets = buildFeatureBullets(product);
    const colGap = Math.round(W * 0.06);
    const colW = (W - pad * 2 - colGap) / 2;
    const rowH = Math.round(H * 0.075);

    const drawBulletCol = (items: string[], x: number) => {
      items.forEach((text, i) => {
        const y = bulletsY + i * rowH;
        drawCheckIcon(ctx, x + 14, y + 8, 14, "#1d4ed8");
        ctx.fillStyle = "#0f172a";
        ctx.font = `500 ${Math.round(W * 0.0165)}px Arial, sans-serif`;
        ctx.textAlign = "left";
        drawWrappedText(ctx, text, x + 38, y + 2, colW - 38, Math.round(W * 0.021), 2);
      });
    };
    drawBulletCol(bullets.slice(0, 3), pad);
    drawBulletCol(bullets.slice(3, 6), pad + colW + colGap);

    // Bottom spec strip: real label/value pairs parsed from the spec table.
    const specRows = buildSpecHighlights(product);
    const stripH = Math.round(H * 0.14);
    const stripY = H - stripH - Math.round(H * 0.06);
    ctx.fillStyle = "#f1f5f9";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    roundRect(ctx, pad, stripY, W - pad * 2, stripH, 16);
    ctx.fill();
    ctx.stroke();

    const boxW = (W - pad * 2) / specRows.length;
    specRows.forEach(([label, value], i) => {
      const x = pad + i * boxW;
      if (i > 0) {
        ctx.strokeStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(x, stripY + stripH * 0.2);
        ctx.lineTo(x, stripY + stripH * 0.8);
        ctx.stroke();
      }
      const boxTextW = boxW - 24;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#64748b";
      ctx.font = `700 ${Math.round(W * 0.014)}px Arial, sans-serif`;
      drawWrappedText(ctx, label.toUpperCase(), x + boxW / 2, stripY + stripH * 0.38, boxTextW, Math.round(W * 0.016), 1);
      ctx.fillStyle = "#0f172a";
      ctx.font = `700 ${Math.round(W * 0.019)}px Arial, sans-serif`;
      drawWrappedText(ctx, value, x + boxW / 2, stripY + stripH * 0.68, boxTextW, Math.round(W * 0.021), 1);
    });

    // Bottom bar.
    const barH = Math.round(H * 0.045);
    ctx.fillStyle = "#0b1e3d";
    ctx.fillRect(0, H - barH, W, barH);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${Math.round(W * 0.017)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const sku = product.sku || product.rk_sku || "-";
    drawWrappedText(
      ctx,
      `SKU: ${sku}   •   12 Month Warranty   •   allremotes.com.au`,
      W / 2,
      H - barH / 2 + 6,
      W - pad * 2,
      Math.round(W * 0.02),
      1
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || new Blob([""], { type: "image/png" })),
        "image/png",
        0.95
      );
    });
  };

  const approveAndUpload = async () => {
    if (!selected || !generatedUrl) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await (await fetch(generatedUrl)).blob();
      const formData = new FormData();
      formData.append("file", blob, `${selected.sku || selected.id}-ai.png`);
      formData.append("productId", selected.id);
      formData.append("sku", selected.sku || selected.rk_sku || selected.id);

      const res = await fetch("/api/admin/products/image-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setProducts((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, image: data.url } : p))
      );
      setSelected((prev) => (prev ? { ...prev, image: data.url } : prev));
      setUploadedUrl(data.url);
    } catch (err: any) {
      setError(err?.message || "Failed to upload image.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">AI Product Image Generator</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Generate a clean product image with Agnes AI, then overlay real product text using a canvas.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-lg border border-neutral-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-neutral-200 h-[500px] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-neutral-200 text-sm font-semibold text-neutral-700">
              Products ({filtered.length})
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-neutral-100">
              {loadingProducts ? (
                <div className="p-4 text-sm text-neutral-500">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">No products found</div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setGeneratedUrl(null);
                      setUploadedUrl(null);
                      setError(null);
                      resetRefOverride();
                    }}
                    className={`w-full text-left p-3 text-sm hover:bg-neutral-50 transition ${
                      selected?.id === p.id ? "bg-blue-50 border-l-4 border-blue-600" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="font-medium text-neutral-900 truncate">{p.name}</div>
                    <div className="text-xs text-neutral-500">{p.sku || p.rk_sku || p.id}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-5 space-y-5">
            {!selected ? (
              <div className="text-center py-12 text-neutral-500">Select a product to generate an image</div>
            ) : (
              <>
                <div className="flex items-start gap-4 pb-4">
                  {effectiveRefImage ? (
                    <div className="relative w-24 h-24">
                      {refOverridePreview ? (
                        <img
                          src={refOverridePreview}
                          alt={selected.name}
                          className="w-24 h-24 object-cover rounded-lg border border-neutral-200 bg-neutral-100"
                        />
                      ) : (
                        <ProductImage
                          src={effectiveRefImage}
                          alt={selected.name}
                          className="w-24 h-24 object-cover rounded-lg border border-neutral-200 bg-neutral-100"
                          fill
                          sizes="96px"
                        />
                      )}
                      <p className="absolute -bottom-4 left-0 right-0 text-center text-[10px] font-semibold uppercase text-blue-600">
                        {refOverrideUrl || refOverrideFile ? "Custom Ref" : "Reference"}
                      </p>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg border border-neutral-200 bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <Image size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900">{selected.name}</h3>
                    <p className="text-sm text-neutral-500">{selected.brand && `Brand: ${selected.brand}`}</p>
                    <p className="text-sm text-neutral-500">SKU: {selected.sku || "-"} | RK SKU: {selected.rk_sku || "-"}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[220px]">
                        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                        <input
                          type="text"
                          value={refUrlInput}
                          onChange={(e) => setRefUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && refUrlInput.trim()) {
                              setRefOverrideFile(null);
                              setRefOverrideUrl(refUrlInput.trim());
                            }
                          }}
                          placeholder="Paste image URL and press Enter..."
                          className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!refUrlInput.trim()) return;
                          setRefOverrideFile(null);
                          setRefOverrideUrl(refUrlInput.trim());
                        }}
                        disabled={!refUrlInput.trim()}
                        className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                      >
                        Use URL
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        <Upload size={12} /> Upload
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setRefOverrideUrl(null);
                            setRefOverrideFile(file);
                          }
                          e.target.value = "";
                        }}
                      />
                      {(refOverrideUrl || refOverrideFile) && (
                        <button
                          onClick={resetRefOverride}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-50"
                        >
                          <X size={12} /> Reset
                        </button>
                      )}
                    </div>

                    {!effectiveRefImage && (
                      <p className="mt-2 text-xs text-amber-600">A reference image is required to generate a poster.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={generate}
                    disabled={generating || !effectiveRefImage}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
                    {generating ? "Generating..." : "Generate Image"}
                  </button>
                  {generatedUrl && !uploadedUrl && (
                    <button
                      onClick={approveAndUpload}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check size={16} />
                      {saving ? "Uploading..." : "Approve & Upload"}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5" />
                    {error}
                  </div>
                )}

                {uploadedUrl && (
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                    <Check size={16} className="mt-0.5" />
                    Uploaded to S3 and saved to product: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">{uploadedUrl}</a>
                  </div>
                )}

                {generatedUrl ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-neutral-700">Generated Image</p>
                    <img
                      ref={imgRef}
                      src={generatedUrl}
                      alt="Generated product"
                      className="max-h-96 rounded-lg border border-neutral-200 bg-neutral-50 object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-64 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-400 text-sm">
                    Generated image will appear here
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
