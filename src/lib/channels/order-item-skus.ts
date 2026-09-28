export function mergeChannelOrderSkus(incoming: any[], existing: any[] = []): any[] {
  const byLine = new Map<string, any>();
  for (const item of existing) {
    const externalId = String(item.externalId || "").trim();
    const sku = String(item.sku || "").trim();
    if (!externalId || ((!sku || sku === externalId) && !item.rk_sku)) continue;
    byLine.set(`${externalId}\u0000${String(item.color || "").trim().toLowerCase()}`, item);
  }
  return incoming.map((item) => {
    const externalId = String(item.externalId || "").trim();
    const previous = externalId
      ? byLine.get(`${externalId}\u0000${String(item.color || "").trim().toLowerCase()}`)
      : undefined;
    if (!previous) return item;
    const incomingSku = String(item.sku || "").trim();
    const previousSku = String(previous.sku || "").trim();
    const keepAssignedSku = !incomingSku || incomingSku === externalId;
    return {
      ...item,
      ...(keepAssignedSku && previousSku ? { sku: previous.sku } : {}),
      ...(!item.rk_sku && previous.rk_sku && (keepAssignedSku || incomingSku === previousSku)
        ? { rk_sku: previous.rk_sku }
        : {}),
    };
  });
}
