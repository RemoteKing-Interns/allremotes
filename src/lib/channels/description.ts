/**
 * Combine a product's Description, Features, Specification, Compatibility, and
 * Instructions rich-text fields into a single HTML block for marketplace listings.
 */
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
    .map((s) => `<h3>${s.label}</h3>${s.value}`);

  return parts.join("<br/>");
}
