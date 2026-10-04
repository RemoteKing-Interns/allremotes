import { NextResponse } from "next/server";
import { sendEmail, baseTemplate, emailCta, emailContactBlock } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, couponCode, discountPercent, items } = body;

    if (!to) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
    }

    if (!couponCode) {
      return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.allremotes.com.au";
    const cartTotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);

    const itemRow = `padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#444;`;
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="${itemRow}">${item.name} <span style="color:#9ca3af;">×${item.quantity}</span></td>
        <td style="${itemRow}text-align:right;">AU$${((item.price || 0) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const content = `
      <h2>You left something behind!</h2>
      <p>We noticed you have items in your cart that you haven't checked out yet. Here's a little nudge — an exclusive discount just for you:</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
        <tr><td align="center" style="background:#f0f9f6;border:2px dashed #1A7A6E;border-radius:10px;padding:22px 20px;">
          <p style="margin:0;font-size:13px;color:#6b7280;">Use this code at checkout:</p>
          <p style="margin:8px 0 4px;font-size:30px;font-weight:800;color:#1A7A6E;letter-spacing:3px;font-family:Consolas,Menlo,monospace;">${couponCode}</p>
          <p style="margin:0;font-size:18px;font-weight:800;color:#C0392B;">${discountPercent}% OFF</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6b7280;">Valid for 7 days · single use</p>
        </td></tr>
      </table>

      <h3>Your Cart</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0;">
        ${itemsHtml}
        <tr>
          <td style="padding:12px 0;font-size:15px;font-weight:700;color:#1f2937;">Total</td>
          <td style="padding:12px 0;text-align:right;font-size:16px;font-weight:800;color:#C0392B;">AU$${cartTotal.toFixed(2)}</td>
        </tr>
      </table>

      ${emailCta(`${siteUrl}/checkout`, 'Complete Your Order')}

      <p style="text-align:center;font-size:13px;color:#6b7280;">
        This discount is exclusive to you — complete your purchase before it expires!
      </p>

      ${emailContactBlock()}
    `;

    const html = baseTemplate(content, 'Complete Your Order', `Your cart is waiting — ${discountPercent}% off inside`);

    const text = `
      You Left Something Behind! 🎁
      
      We noticed you have items in your cart that you haven't checked out yet.
      
      Your exclusive discount code: ${couponCode}
      ${discountPercent}% OFF - Valid for 7 days
      
      Your Cart:
      ${items.map((item: any) => `- ${item.name} x${item.quantity} - AU$${((item.price || 0) * item.quantity).toFixed(2)}`).join('\n')}
      
      Total: AU$${cartTotal.toFixed(2)}
      
      Complete your order now: ${siteUrl}/checkout
      
      This discount is exclusive to you and can only be used once.
      
      All Remotes - Your Trusted Remote Control Store
      Questions? Contact us at shane@allremotes.com.au
    `;

    await sendEmail({
      to,
      subject: `Complete Your Order - ${discountPercent}% Off`,
      html,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to send email", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
