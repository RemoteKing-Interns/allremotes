import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://allremotes.com.au";
    const cartTotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Order - ${discountPercent}% Off</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .coupon-box { background: #f0fdf4; border: 2px dashed #10b981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .coupon-code { font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 2px; margin: 10px 0; }
          .items-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .item:last-child { border-bottom: none; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 20px; }
          .button:hover { background: #059669; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 You Left Something Behind!</h1>
          </div>
          <div class="content">
            <p>We noticed you have items in your cart that you haven't checked out yet. Don't miss out!</p>
            
            <div class="coupon-box">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Use this exclusive code at checkout:</p>
              <div class="coupon-code">${couponCode}</div>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">${discountPercent}% OFF</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Valid for 7 days</p>
            </div>

            <div class="items-list">
              <h3 style="margin-top: 0; font-size: 16px; color: #374151;">Your Cart:</h3>
              ${items.map((item: any) => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>AU$${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
              <div class="item" style="font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #e5e7eb;">
                <span>Total:</span>
                <span>AU$${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${siteUrl}/checkout" class="button">Complete Your Order Now</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              This discount is exclusive to you and can only be used once. Complete your purchase before the offer expires!
            </p>
          </div>
          <div class="footer">
            <p>All Remotes - Your Trusted Remote Control Store</p>
            <p>Questions? Contact us at shane@allremotes.com.au</p>
          </div>
        </div>
      </body>
      </html>
    `;

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
