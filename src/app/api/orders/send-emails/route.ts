import { NextResponse } from "next/server";
import { getDb, mongoEnabled } from "@/lib/mongo";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin email for notifications
const ADMIN_EMAIL = "shane@allremotes.com.au";

interface OrderEmailRequest {
  orderId: string;
  customerEmail: string;
  orderDetails: {
    customer: {
      fullName: string;
      email: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    pricing: {
      subtotal: number;
      discountTotal?: number;
      total: number;
    };
    shipping: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      phone?: string;
      deliveryInstructions?: string;
    };
  };
}

export async function POST(request: Request) {
  try {
    const body: OrderEmailRequest = await request.json();
    const { orderId, customerEmail, orderDetails } = body;

    if (!orderId || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build email content
    const orderNumber = orderId.slice(-8).toUpperCase();
    const itemsList = orderDetails.items.map(item => 
      `• ${item.name} x${item.quantity} - $${item.lineTotal.toFixed(2)}`
    ).join('\n');

    const shippingAddress = [
      orderDetails.shipping.address,
      orderDetails.shipping.city,
      `${orderDetails.shipping.state} ${orderDetails.shipping.zipCode}`
    ].filter(Boolean).join(', ');

    const discountLine = orderDetails.pricing.discountTotal 
      ? `Member Discount: -$${orderDetails.pricing.discountTotal.toFixed(2)}\n`
      : '';

    const discountHtml = orderDetails.pricing.discountTotal 
      ? `<tr><td>Member Discount:</td><td>-$${orderDetails.pricing.discountTotal.toFixed(2)}</td></tr>`
      : '';

    const deliveryInstructions = orderDetails.shipping.deliveryInstructions 
      ? `\n📋 Delivery Instructions: ${orderDetails.shipping.deliveryInstructions}`
      : '';

    const deliveryInstructionsHtml = orderDetails.shipping.deliveryInstructions 
      ? `<tr><td colspan="2"><strong>📋 Delivery Instructions:</strong> ${orderDetails.shipping.deliveryInstructions}</td></tr>`
      : '';

    // Customer confirmation email (Text)
    const customerEmailBody = `Hi ${orderDetails.customer.fullName},

Thank you for your order! We've received your purchase and will process it shortly.

📦 ORDER #${orderNumber}

Items:
${itemsList}

Subtotal: $${orderDetails.pricing.subtotal.toFixed(2)}
${discountLine}Total: $${orderDetails.pricing.total.toFixed(2)} AUD

🚚 Shipping Address:
${shippingAddress}${orderDetails.shipping.phone ? `\n📞 ${orderDetails.shipping.phone}` : ''}${deliveryInstructions}

We'll send you another email when your order ships.

Questions? Reply to this email or contact us at ${ADMIN_EMAIL}

Best regards,
AllRemotes Team
`;

    // Customer confirmation email (HTML)
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF6B35;">Thank you for your order!</h2>
        <p>Hi ${orderDetails.customer.fullName},</p>
        <p>We've received your purchase and will process it shortly.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📦 ORDER #${orderNumber}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${orderDetails.items.map(item => `
              <tr>
                <td>${item.name} x${item.quantity}</td>
                <td style="text-align: right;">$${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr><td colspan="2"><hr></td></tr>
            <tr><td>Subtotal:</td><td style="text-align: right;">$${orderDetails.pricing.subtotal.toFixed(2)}</td></tr>
            ${discountHtml}
            <tr><td><strong>Total:</strong></td><td style="text-align: right;"><strong>$${orderDetails.pricing.total.toFixed(2)} AUD</strong></td></tr>
          </table>
        </div>
        
        <div style="background: #fff8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">🚚 Shipping Address</h3>
          <p>
            ${orderDetails.customer.fullName}<br>
            ${orderDetails.shipping.address}<br>
            ${orderDetails.shipping.city}, ${orderDetails.shipping.state} ${orderDetails.shipping.zipCode}<br>
            ${orderDetails.shipping.phone ? `📞 ${orderDetails.shipping.phone}<br>` : ''}
          </p>
          ${deliveryInstructionsHtml}
        </div>
        
        <p>We'll send you another email when your order ships.</p>
        <p>Questions? Reply to this email or contact us at <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></p>
        
        <p>Best regards,<br><strong>AllRemotes Team</strong></p>
      </div>
    `;

    // Admin notification email (Text)
    const adminEmailBody = `🛒 NEW ORDER RECEIVED

Order: #${orderNumber}
Customer: ${orderDetails.customer.fullName}
Email: ${customerEmail}
Phone: ${orderDetails.shipping.phone || 'Not provided'}

📦 ITEMS:
${itemsList}

💰 TOTAL: $${orderDetails.pricing.total.toFixed(2)} AUD

🚚 SHIPPING TO:
${orderDetails.customer.fullName}
${orderDetails.shipping.address}
${orderDetails.shipping.city}, ${orderDetails.shipping.state} ${orderDetails.shipping.zipCode}${deliveryInstructions}

---
View order in admin: http://localhost:3000/admin/orders
`;

    // Admin notification email (HTML)
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #FF6B35;">🛒 NEW ORDER RECEIVED</h2>
        
        <table style="width: 100%; margin-bottom: 20px;">
          <tr><td><strong>Order:</strong></td><td>#${orderNumber}</td></tr>
          <tr><td><strong>Customer:</strong></td><td>${orderDetails.customer.fullName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${customerEmail}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${orderDetails.shipping.phone || 'Not provided'}</td></tr>
        </table>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📦 ITEMS</h3>
          <table style="width: 100%;">
            ${orderDetails.items.map(item => `
              <tr>
                <td>${item.name} x${item.quantity}</td>
                <td style="text-align: right;">$${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <h3 style="color: #FF6B35; margin-top: 20px;">💰 TOTAL: $${orderDetails.pricing.total.toFixed(2)} AUD</h3>
        </div>
        
        <div style="background: #fff8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">🚚 SHIPPING TO</h3>
          <p>
            ${orderDetails.customer.fullName}<br>
            ${orderDetails.shipping.address}<br>
            ${orderDetails.shipping.city}, ${orderDetails.shipping.state} ${orderDetails.shipping.zipCode}
          </p>
          ${deliveryInstructionsHtml}
        </div>
        
        <p><a href="http://localhost:3000/admin/orders" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Admin</a></p>
      </div>
    `;

    // Send emails using the email service
    const [customerResult, adminResult] = await Promise.all([
      sendEmail({
        to: customerEmail,
        subject: `Order Confirmation #${orderNumber} - AllRemotes`,
        html: customerEmailHtml,
        text: customerEmailBody,
      }),
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `🛒 New Order #${orderNumber} - AllRemotes`,
        html: adminEmailHtml,
        text: adminEmailBody,
      }),
    ]);

    if (!customerResult.success || !adminResult.success) {
      console.error("Email sending failed:", customerResult.error || adminResult.error);
    }

    return NextResponse.json({ 
      success: true, 
      customerEmailSent: customerResult.success,
      adminEmailSent: adminResult.success 
    });
  } catch (error: any) {
    console.error("Order email error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send emails" },
      { status: 500 }
    );
  }
}
