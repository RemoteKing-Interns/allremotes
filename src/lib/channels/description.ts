/**
 * Combine a product's rich-text fields into a single HTML block for marketplace listings.
 * Produces clean, eBay-compatible HTML with branded styling.
 */

function stripEmojis(str: string): string {
  return str
    .replace(/[\u{2600}-\u{27BF}\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "")
    .trim();
}

function cleanHtml(html: string): string {
  let cleaned = stripEmojis(html);
  // Collapse multiple consecutive <br> tags
  cleaned = cleaned.replace(/(<br\s*\/?>\s*){2,}/gi, "<br/>");
  // Remove empty paragraphs/divs
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, "");
  // Strip inline font-family/size styles (eBay doesn't respect them well)
  cleaned = cleaned.replace(/font-family:\s*[^;"']+;?/gi, "");
  cleaned = cleaned.replace(/font-size:\s*[^;"']+;?/gi, "");
  cleaned = cleaned.replace(/style="\s*"/gi, "");
  return cleaned.trim();
}

function wrapPlainText(text: string): string {
  // If the value contains HTML tags, clean it. Otherwise wrap as paragraphs.
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return cleanHtml(text);
  }
  const lines = text.split(/\n/).filter((l) => l.trim());
  if (lines.length <= 1) return `<p>${text.trim()}</p>`;
  return lines.map((l) => `<p>${l.trim()}</p>`).join("\n");
}

function sectionHtml(label: string, content: string): string {
  return (
    `<section style="margin-bottom:20px;">\n` +
    `<h2 style="font-size:18px;font-weight:bold;color:#1a1a1a;border-bottom:2px solid #C0392B;padding-bottom:6px;margin:0 0 12px 0;">${label}</h2>\n` +
    `<div style="font-size:14px;line-height:1.7;color:#333;">\n${content}\n</div>\n` +
    `</section>`
  );
}

export function buildFullDescription(product: any): string {
  const sections: Array<{ label: string; value?: string }> = [
    { label: "Description", value: product?.description },
    { label: "What's Included", value: product?.whatsIncluded || product?.whats_included },
    { label: "Features", value: product?.features || product?.feature },
    { label: "Specification", value: product?.specification },
    { label: "Compatibility", value: product?.compatibility },
    { label: "Important Information", value: product?.importantInfo || product?.important_info },
    { label: "Instructions", value: product?.instructions },
  ];

  const parts = sections
    .filter((s) => s.value && String(s.value).trim())
    .map((s) => sectionHtml(s.label, wrapPlainText(String(s.value))));

  if (parts.length === 0) return "";

  const header =
    `<div style="background:#C0392B;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;margin-bottom:20px;">\n` +
    `<h1 style="font-size:22px;font-weight:bold;margin:0;">${product?.brand || "ALLREMOTES"} ${product?.model || product?.name || ""}</h1>\n` +
    `<p style="font-size:13px;margin:6px 0 0 0;opacity:0.9;">Premium replacement remote — Australian stock, fast shipping, 12-month warranty.</p>\n` +
    `</div>\n`;

  const footer =
    `\n<div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:8px;padding:16px 20px;margin-top:20px;">\n` +
    `<h2 style="font-size:18px;font-weight:bold;color:#1a1a1a;margin:0 0 10px 0;">Why Choose All Remotes?</h2>\n` +
    `<ul style="font-size:14px;line-height:1.8;color:#333;margin:0;padding-left:20px;">\n` +
    `<li>Australian owned and operated</li>\n` +
    `<li>Fast shipping across Australia</li>\n` +
    `<li>Premium quality tested products</li>\n` +
    `<li>Battery included with every remote</li>\n` +
    `<li>Friendly, local technical support</li>\n` +
    `<li>12-month warranty on all remotes</li>\n` +
    `<li>30-day returns accepted within Australia</li>\n` +
    `</ul>\n` +
    `<p style="font-size:13px;color:#666;margin:12px 0 0 0;">Need help choosing the right remote? Contact our friendly support team.</p>\n` +
    `</div>`;

  return header + parts.join('\n') + footer;
}
