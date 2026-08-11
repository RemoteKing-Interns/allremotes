/**
 * Packing-slip data normalizer and template renderer.
 * Works for any order source that provides customer/shipping/items/pricing.
 */

export interface PackingSlipData {
  storeName: string;
  storeUrl: string;
  orderId: string;
  displayOrderId: string;
  externalOrderId?: string;
  channel?: string;
  orderDate: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerUsername: string;
  shipTo: {
    fullName: string;
    address: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    cityLine: string;
    country: string;
    phone?: string;
  };
  items: Array<{
    index: number;
    name: string;
    sku: string;
    externalId: string;
    color: string;
    qty: number;
    price: string;
    lineTotal: string;
  }>;
  subtotal: string;
  shippingCost: string;
  discount: string;
  total: string;
  currency: string;
  postageService: string;
  footerText: string;
  abn: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value: number | undefined | null, fallback = 0): string {
  return Number(value ?? fallback).toFixed(2);
}

export function buildPackingSlipData(order: any): PackingSlipData {
  const customer = order.customer || {};
  const shipping = order.shipping || {};
  const pricing = order.pricing || {};
  const currency = pricing.currency || "AUD";

  const cityLine = [shipping.city, [shipping.state, shipping.zipCode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const items = (order.items || []).map((item: any, index: number) => ({
    index: index + 1,
    name: String(item.name || ""),
    sku: String(item.sku || ""),
    externalId: String(item.externalId || ""),
    color: String(item.color || ""),
    qty: Number(item.quantity || 0),
    price: formatMoney(item.unitPrice),
    lineTotal: formatMoney(item.lineTotal),
  }));

  const data: PackingSlipData = {
    storeName: "All Remotes",
    storeUrl: "https://www.allremotes.com.au",
    abn: "23 679 611 351",
    orderId: String(order.id || ""),
    displayOrderId: order.externalOrderId ? String(order.externalOrderId) : String(order.id || ""),
    externalOrderId: order.externalOrderId ? String(order.externalOrderId) : undefined,
    channel: order.channel ? String(order.channel) : undefined,
    orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    buyerName: customer.fullName || customer.name || "",
    buyerEmail: customer.email || "",
    buyerPhone: customer.phone || shipping.phone || "",
    buyerUsername: customer.username || "",
    shipTo: {
      fullName: customer.fullName || customer.name || "",
      address: shipping.address || "",
      address2: shipping.address2 || "",
      city: shipping.city || "",
      state: shipping.state || "",
      zipCode: shipping.zipCode || "",
      cityLine,
      country: shipping.country || "Australia",
      phone: shipping.phone || customer.phone || "",
    },
    items,
    subtotal: formatMoney(pricing.subtotal),
    shippingCost: formatMoney(pricing.shipping),
    discount: formatMoney(pricing.discountTotal),
    total: formatMoney(pricing.total),
    currency,
    postageService: order.postageService || "",
    footerText:
      !order.channel || String(order.channel).toLowerCase() === "website"
        ? ""
        : "Users who create a trade account and order via our website receive special discounts.",
  };

  return data;
}

function resolveValue(path: string, context: any): string {
  const parts = path.split(".").filter(Boolean);
  let value: any = context;
  for (const part of parts) {
    value = value?.[part];
    if (value == null) return "";
  }
  return String(value ?? "");
}

function replacePlaceholders(template: string, context: any): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    return escapeHtml(resolveValue(path, context));
  });
}

export function renderPackingSlipHtml(template: string, data: PackingSlipData): string {
  let html = template;

  // handle {{#each items}} ... {{/each}} blocks
  const eachRegex = /\{\{\s*#each\s+([\w]+)\s*\}\}([\s\S]*?)\{\{\s*\/each\s*\}\}/g;
  html = html.replace(eachRegex, (block, arrayName, inner) => {
    const arr: any[] = data[arrayName as keyof PackingSlipData] as any[];
    if (!Array.isArray(arr)) return "";
    return arr
      .map((item) => replacePlaceholders(inner, { ...data, ...item }))
      .join("");
  });

  // scalar placeholders
  html = replacePlaceholders(html, data);
  return html;
}

export const DEFAULT_PACKING_SLIP_TEMPLATE = `<!-- Custom packing slip template. Use {{field}} for order data, {{#each items}}...{{/each}} for line items. -->
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1a1a1a; }
  .slip { max-width: 794px; margin: 0 auto; padding: 32px; min-height: 1000px; }
  .slip ~ .slip { page-break-before: always; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .packing-label { text-align: right; }
  .packing-label h1 { font-size: 18px; color: #9a9a9a; font-weight: 400; margin: 0 0 4px; text-transform: uppercase; }
  .packing-label p { font-size: 12px; color: #9a9a9a; margin: 0; }
  .store { text-align: center; flex: 1; }
  .store-abn { font-size: 12px; color: #555; margin-top: 4px; }
  .store-logo img { height: 48px; width: auto; }
  .store-url { font-size: 13px; color: #1a1a1a; }
  .qr { text-align: right; }
  .qr img { width: 90px; height: 90px; }
  .qr-caption { font-size: 11px; color: #555; margin-top: 4px; }
  .mid { display: flex; justify-content: space-between; gap: 24px; margin: 24px 0; }
  .deliver-to h2 { font-size: 13px; font-weight: 700; margin: 0 0 8px; }
  .deliver-to .address { font-size: 14px; line-height: 1.5; }
  .qr-box { text-align: right; }
  .contact { font-size: 13px; line-height: 1.6; margin: 16px 0 24px; }
  .order-row { display: flex; justify-content: space-between; align-items: baseline; margin: 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; }
  .order-id { font-size: 18px; font-weight: 700; }
  .order-date { font-size: 14px; color: #555; }
  .sales-record { font-size: 12px; color: #555; margin-top: 4px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 16px; }
  table.items th { text-align: left; border-bottom: 1px solid #999; padding: 8px; font-size: 12px; color: #555; font-weight: 400; }
  table.items td { padding: 10px 8px; border-bottom: 1px solid #e5e5e5; font-size: 13px; vertical-align: top; }
  table.items td.qty { text-align: center; }
  table.items td.price, table.items td.total { text-align: right; }
  table.items td .currency { display: block; font-size: 11px; color: #555; }
  table.items td .amount { display: block; }
  .item-meta { font-size: 11px; color: #555; margin-top: 4px; }
  .postage { text-align: right; font-size: 12px; color: #555; margin: 12px 0; }
  .postage strong { color: #1a1a1a; }
  .totals { width: 260px; margin-left: auto; margin-top: 16px; font-size: 14px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .row.total { font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 18px; font-weight: 700; color: #1a1a1a; text-align: center; }
  @media print { .no-print, button { display: none; } body { padding: 0; } }
</style>
<div class="slip">
  <div class="top">
    <div class="store">
      <div class="store-logo"><img src="/images/mainlogo.png" alt="{{storeName}}"></div>
      <div class="store-url">{{storeUrl}}</div>
      <div class="store-abn">ABN: {{abn}}</div>
    </div>
    <div class="packing-label">
      <h1>INVOICE</h1>
    </div>
  </div>

  <div class="mid">
    <div class="deliver-to">
      <h2>Deliver to</h2>
      <div class="address">
        {{shipTo.fullName}}<br>
        {{shipTo.address}}<br>
        {{shipTo.address2}}
        {{shipTo.cityLine}}<br>
        {{shipTo.country}}
      </div>
    </div>
    <div class="qr-box">
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data={{storeUrl}}" alt="Store QR">
        <div class="qr-caption">Store QR code link</div>
      </div>
    </div>
  </div>

  <div class="contact">
    {{buyerPhone}}<br>
    {{buyerEmail}}
  </div>

  <div class="order-row">
    <div>
      <div class="order-id">Order: {{displayOrderId}}</div>
      <div class="sales-record">Sales record #: {{orderId}}</div>
    </div>
    <div class="order-date">Order date: {{orderDate}}</div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>Item</th>
        <th class="qty">Quantity</th>
        <th class="price">Item price</th>
        <th class="total">Item total</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td>
          {{name}}<br>
          <div class="item-meta">(Item ID: {{externalId}})</div>
          <div class="item-meta">Color: {{color}}</div>
        </td>
        <td class="qty">{{qty}}</td>
        <td class="price">
          <span class="currency">{{currency}}</span>
          <span class="amount">\${{price}}</span>
        </td>
        <td class="total">
          <span class="currency">{{currency}}</span>
          <span class="amount">\${{lineTotal}}</span>
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="postage"><strong>Buyer selected postage service:</strong> {{postageService}}</div>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>{{currency}} \${{subtotal}}</span></div>
    <div class="row"><span>Postage</span><span>{{currency}} \${{shippingCost}}</span></div>
    <div class="row"><span>Discount</span><span>{{currency}} \${{discount}}</span></div>
    <div class="row total"><span>Order total</span><span>{{currency}} \${{total}}</span></div>
    <div class="row" style="font-size: 11px; color: #555; justify-content: flex-end; padding-top: 4px;">All prices inclusive of GST</div>
  </div>

  <div class="footer">{{footerText}}</div>
</div>`;
