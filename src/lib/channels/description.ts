/**
 * Combine a product's Description, Features, Specification, Compatibility, and
 * Instructions rich-text fields into a single HTML block for marketplace listings.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/[\u{2600}-\u{27BF}\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br/>")
    .trim();
}

export function buildFullDescription(product: any): string {
  const sections: Array<{ label: string; value?: string }> = [
    { label: "Description", value: product?.description },
    { label: "Features", value: product?.features || product?.feature },
    { label: "Specification", value: product?.specification },
    { label: "Compatibility", value: product?.compatibility },
    { label: "Instructions", value: product?.instructions },
  ];

  const parts = sections
    .filter((s) => s.value && String(s.value).trim())
    .map(
      (s) =>
        `<section style="margin-bottom: 1.5rem;">\n` +
        `<h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${s.label}</h2>\n` +
        `${cleanHtml(String(s.value))}\n` +
        `</section>`
    );

  return parts.join(
    '\n<hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 1.5rem 0;" />\n'
  );
}
