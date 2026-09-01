import nodemailer from 'nodemailer';
import { buildTrackingLink } from './tracking';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@allremotes.com.au';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'All Remotes';

// Create transporter
const createTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

// Base email template — branded, table-based layout for email client compatibility
const baseTemplate = (content: string, title: string) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4efe8; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    h2 { color: #17353a; font-size: 26px; font-weight: 800; margin: 0 0 18px; line-height: 1.3; }
    h3 { color: #17353a; font-size: 18px; font-weight: 700; margin: 26px 0 12px; }
    p { color: #34525a; font-size: 16px; line-height: 1.7; margin: 14px 0; }
    a { color: #1A7A6E; }
    .content-table th, .content-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #eee8e1; font-size: 15px; color: #34525a; }
    .content-table th { font-weight: 700; background: #f4efe8; color: #17353a; }
    .button { display: inline-block; padding: 16px 40px; background-color: #C0392B; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 17px; }
    .info-box { background: #f4efe8; border-left: 5px solid #1A7A6E; padding: 20px 22px; border-radius: 10px; margin: 22px 0; color: #17353a; font-size: 16px; line-height: 1.8; }
    .info-box strong { color: #0F4F47; }
    .divider { height: 1px; background: #eee8e1; margin: 28px 0; border: none; }
    .contact-section { background: #f4efe8; padding: 20px; border-radius: 10px; margin-top: 26px; text-align: center; }
    .contact-section p { margin: 6px 0; color: #17353a; }
    .contact-section a { color: #0F4F47; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4efe8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4efe8;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#0F4F47;padding:36px 24px;border-radius:16px 16px 0 0;">
              <img src="${siteUrl}/images/mainlogo.png" alt="All Remotes" width="190" style="display:block;max-width:190px;height:auto;margin:0 auto 12px;" />
              <div style="color:#ffffff;font-size:24px;font-weight:800;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:0.3px;">${title}</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 36px;border:1px solid #dfd7cf;border-top:none;border-radius:0 0 16px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.7;color:#34525a;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:4px 0;color:#67777d;font-size:13px;">&copy; ${new Date().getFullYear()} All Remotes. All rights reserved.</p>
              <p style="margin:4px 0;"><a href="${siteUrl}" style="color:#0F4F47;font-weight:600;text-decoration:none;font-size:13px;">allremotes.com.au</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Check if emails are enabled via the content/settings store
async function areEmailsEnabled(): Promise<boolean> {
  try {
    const { mongoEnabled, getDb } = await import('./mongo');
    if (mongoEnabled()) {
      const db = await getDb();
      const doc = await db.collection('content').findOne({ _id: 'settings' } as any);
      if (doc && (doc as any).data?.emailsEnabled === false) return false;
    }
  } catch {
    // If we can't check, default to enabled
  }
  return true;
}

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const enabled = await areEmailsEnabled();
  if (!enabled) {
    console.log(`[Email] Sending disabled via settings. Skipping email to ${to}: "${subject}"`);
    return { success: false, error: 'Email sending is disabled in admin settings' };
  }

  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('Email transporter not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Order confirmation email
export async function sendOrderConfirmationEmail({
  to,
  orderId,
  customerName,
  items,
  total,
  shippingAddress,
}: {
  to: string;
  orderId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  shippingAddress: string;
}) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #eee8e1;font-size:15px;color:#34525a;">${item.name}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee8e1;font-size:15px;color:#34525a;">${item.quantity}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee8e1;font-size:15px;color:#34525a;">AU$${item.price.toFixed(2)}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #eee8e1;font-size:15px;color:#34525a;">AU$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Thank you for your order, ${customerName}!</h2>
    <p>Your order has been received and is being processed.</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Order Date:</strong> ${new Date().toLocaleDateString('en-AU')}
    </div>
    
    <h3>Order Summary</h3>
    <table width="100%" style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr>
          <th style="padding:12px 14px;text-align:left;background:#f4efe8;color:#17353a;font-weight:700;font-size:15px;border-bottom:1px solid #eee8e1;">Product</th>
          <th style="padding:12px 14px;text-align:left;background:#f4efe8;color:#17353a;font-weight:700;font-size:15px;border-bottom:1px solid #eee8e1;">Qty</th>
          <th style="padding:12px 14px;text-align:left;background:#f4efe8;color:#17353a;font-weight:700;font-size:15px;border-bottom:1px solid #eee8e1;">Price</th>
          <th style="padding:12px 14px;text-align:left;background:#f4efe8;color:#17353a;font-weight:700;font-size:15px;border-bottom:1px solid #eee8e1;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <p style="text-align: right; font-size: 18px; font-weight: bold; color: #C0392B;">
      Total: AU$${total.toFixed(2)}
    </p>
    
    <h3>Shipping Address</h3>
    <p>${shippingAddress.replace(/\n/g, '<br>')}</p>
    
    <hr class="divider" style="height:1px;background:#eee8e1;margin:28px 0;border:none;" />
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/account/orders" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
        View Order Details
      </a>
    </center>
  `;

  return sendEmail({
    to,
    subject: `Order Confirmation #${orderId}`,
    html: baseTemplate(content, 'Order Confirmation'),
  });
}

// Shipping update email
export async function sendShippingUpdateEmail({
  to,
  orderId,
  customerName,
  trackingNumber,
  carrier,
  status,
  estimatedDelivery,
  trackingLink,
}: {
  to: string;
  orderId: string;
  customerName: string;
  trackingNumber?: string;
  carrier?: string;
  status: string;
  estimatedDelivery?: string;
  trackingLink?: string;
}) {
  const trackUrl = trackingLink || buildTrackingLink(carrier || '', trackingNumber || '');

  const content = `
    <h2>Shipping Update for Order #${orderId}</h2>
    <p>Hi ${customerName},</p>
    <p>Great news! Your order status has been updated to: <strong style="color:#C0392B;">${status}</strong></p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      ${trackingNumber ? `<strong>Tracking Number:</strong> ${trackingNumber}<br>` : ''}
      ${carrier ? `<strong>Carrier:</strong> ${carrier}<br>` : ''}
      ${estimatedDelivery ? `<strong>Estimated Delivery:</strong> ${estimatedDelivery}<br>` : ''}
    </div>
    
    ${trackUrl ? `
      <center>
        <a href="${trackUrl}" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">Track Package</a>
      </center>
    ` : ''}
    
    <hr class="divider" style="height:1px;background:#eee8e1;margin:28px 0;border:none;" />
    
    <div class="contact-section" style="background:#f4efe8;padding:20px;border-radius:10px;margin-top:26px;text-align:center;">
      <p>Questions about your order? We're here to help!</p>
      <p><a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a></p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Shipping Update - Order #${orderId}`,
    html: baseTemplate(content, 'Shipping Update'),
  });
}

// Order delivered email
export async function sendOrderDeliveredEmail({
  to,
  orderId,
  customerName,
  deliveredDate,
}: {
  to: string;
  orderId: string;
  customerName: string;
  deliveredDate: string;
}) {
  const content = `
    <h2>Your Order Has Been Delivered!</h2>
    <p>Hi ${customerName},</p>
    <p>Great news! Your order #${orderId} has been delivered on <strong style="color:#C0392B;">${deliveredDate}</strong>.</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      We hope you enjoy your purchase! If you have any issues with your order, please contact us — all products are covered by our 12-month warranty.
    </div>
    
    <hr class="divider" style="height:1px;background:#eee8e1;margin:28px 0;border:none;" />
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/account/orders" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
        Leave a Review
      </a>
    </center>
    
    <div class="contact-section" style="background:#f4efe8;padding:20px;border-radius:10px;margin-top:26px;text-align:center;">
      <p>Need help? We're here for you!</p>
      <p><a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a></p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Order Delivered - Order #${orderId}`,
    html: baseTemplate(content, 'Order Delivered'),
  });
}

// Password reset email
export async function sendPasswordResetEmail({
  to,
  resetToken,
  customerName,
  baseUrl,
}: {
  to: string;
  resetToken: string;
  customerName: string;
  baseUrl?: string;
}) {
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au';
  const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;
  
  const resetTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - All Remotes</title>
  <style>
    body { 
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      line-height: 1.6; 
      color: #17353a; 
      margin: 0; 
      padding: 0; 
      background-color: #fbf8f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #C0392B 0%, #A02D23 100%); 
      padding: 30px 20px; 
      text-align: center; 
      border-radius: 12px 12px 0 0;
    }
    .header img {
      max-width: 180px;
      height: auto;
      margin-bottom: 10px;
    }
    .content { 
      background: #ffffff; 
      padding: 40px 30px; 
      border: 1px solid #eee8e1; 
      border-top: none;
      border-radius: 0 0 12px 12px;
    }
    .title {
      color: #C0392B;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .content p {
      color: #34525a;
      font-size: 16px;
      margin: 15px 0;
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background: #C0392B; 
      color: white; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 20px 0; 
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(192, 57, 43, 0.3);
    }
    .button:hover {
      background: #A02D23;
    }
    .warning-box {
      background: #fff8f0;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .warning-box p {
      color: #92400e;
      font-size: 14px;
      margin: 0;
    }
    .footer { 
      text-align: center; 
      padding: 30px 20px; 
      color: #67777d; 
      font-size: 13px; 
    }
    .footer a {
      color: #1A7A6E;
      text-decoration: none;
    }
    .link-fallback {
      background: #f4efe8;
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      word-break: break-all;
      font-size: 13px;
      color: #67777d;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${siteUrl}/images/mainlogo.png" alt="All Remotes" />
    </div>
    <div class="content">
      <h2 class="title">Password Reset Request</h2>
      <p>Hi ${customerName},</p>
      <p>We received a request to reset your password for your All Remotes account. Click the button below to set a new password:</p>
      
      <center>
        <a href="${resetUrl}" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">Reset My Password</a>
      </center>
      
      <p style="text-align: center; font-size: 14px; color: #67777d;">
        Or copy and paste this link:
      </p>
      <div class="link-fallback">
        ${resetUrl}
      </div>
      
      <div class="warning-box">
        <p><strong>Important:</strong> This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email or contact us if you have concerns.</p>
      </div>
      
      <p>Need help? Contact us at <a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a></p>
    </div>
    <div class="footer">
      <p>This email was sent from All Remotes.</p>
      <p>&copy; ${new Date().getFullYear()} All Remotes. All rights reserved.</p>
      <p>${siteUrl}</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: 'Password Reset Request - All Remotes',
    html: resetTemplate,
  });
}

// Welcome email with brand colors and logo
export async function sendWelcomeEmail({
  to,
  customerName,
}: {
  to: string;
  customerName: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au';
  
  const welcomeTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to All Remotes!</title>
  <style>
    body { 
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      line-height: 1.6; 
      color: #17353a; 
      margin: 0; 
      padding: 0; 
      background-color: #fbf8f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
    }
    .header { 
      background: linear-gradient(135deg, #1A7A6E 0%, #0F4F47 100%); 
      padding: 30px 20px; 
      text-align: center; 
      border-radius: 12px 12px 0 0;
    }
    .header img {
      max-width: 180px;
      height: auto;
      margin-bottom: 10px;
    }
    .header h1 { 
      color: white; 
      margin: 0; 
      font-size: 24px; 
      font-weight: 600;
    }
    .content { 
      background: #ffffff; 
      padding: 40px 30px; 
      border: 1px solid #eee8e1; 
      border-top: none;
      border-radius: 0 0 12px 12px;
    }
    .welcome-title {
      color: #C0392B;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .content p {
      color: #34525a;
      font-size: 16px;
      margin: 15px 0;
    }
    .info-box { 
      background: #f4efe8; 
      border-left: 4px solid #1A7A6E;
      padding: 20px; 
      border-radius: 8px; 
      margin: 25px 0; 
    }
    .info-box strong {
      color: #1A7A6E;
      font-size: 16px;
    }
    .info-box ul {
      margin: 15px 0 0 0;
      padding-left: 25px;
      color: #34525a;
    }
    .info-box li {
      margin: 10px 0;
      font-size: 15px;
    }
    .button { 
      display: inline-block; 
      padding: 14px 32px; 
      background: #C0392B; 
      color: white; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 20px 0; 
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(192, 57, 43, 0.3);
    }
    .button:hover {
      background: #A02D23;
    }
    .footer { 
      text-align: center; 
      padding: 30px 20px; 
      color: #67777d; 
      font-size: 13px; 
    }
    .footer a {
      color: #1A7A6E;
      text-decoration: none;
    }
    .contact-section {
      background: #fbf8f5;
      padding: 20px;
      border-radius: 8px;
      margin-top: 25px;
      text-align: center;
    }
    .contact-section a {
      color: #1A7A6E;
      font-weight: 600;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${siteUrl}/images/mainlogo.png" alt="All Remotes" />
    </div>
    <div class="content">
      <h2 class="welcome-title">Welcome to All Remotes!</h2>
      <p>Hi ${customerName},</p>
      <p>Thank you for creating an account with us. We're excited to have you on board!</p>
      
      <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
        <strong>What you can do now:</strong>
        <ul>
          <li>Browse our extensive collection of remotes</li>
          <li>Save your favorite products to your wishlist</li>
          <li>Track your orders easily</li>
          <li>Get exclusive offers and promotions</li>
        </ul>
      </div>
      
      <center>
        <a href="${siteUrl}/products/all" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
          Start Shopping
        </a>
      </center>
      
      <div class="contact-section" style="background:#f4efe8;padding:20px;border-radius:10px;margin-top:26px;text-align:center;">
        <p>Questions? We're here to help!</p>
        <p><a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a></p>
      </div>
    </div>
    <div class="footer">
      <p>This email was sent from All Remotes.</p>
      <p>&copy; ${new Date().getFullYear()} All Remotes. All rights reserved.</p>
      <p>${siteUrl}</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: 'Welcome to All Remotes!',
    html: welcomeTemplate,
  });
}

// Low stock notification for admin
export async function sendLowStockNotification({
  to,
  productName,
  sku,
  currentStock,
}: {
  to: string;
  productName: string;
  sku: string;
  currentStock: number;
}) {
  const content = `
    <h2>Low Stock Alert</h2>
    <p>The following product is running low on stock:</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>Product:</strong> ${productName}<br>
      <strong>SKU:</strong> ${sku}<br>
      <strong>Current Stock:</strong> ${currentStock}<br>
    </div>
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/admin" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
        Manage Inventory
      </a>
    </center>
  `;

  return sendEmail({
    to,
    subject: `Low Stock Alert: ${productName}`,
    html: baseTemplate(content, 'Low Stock Alert'),
  });
}

// Return request notification
export async function sendReturnRequestEmail({
  to,
  orderId,
  customerName,
  customerEmail,
  reason,
  items,
}: {
  to: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  items: string[];
}) {
  const content = `
    <h2>New Return Request</h2>
    <p>A customer has submitted a return request:</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Customer:</strong> ${customerName}<br>
      <strong>Email:</strong> ${customerEmail}<br>
      <strong>Reason:</strong> ${reason}<br>
    </div>
    
    <h3>Items to Return:</h3>
    <ul style="padding-left: 20px; color: #34525a;">
      ${items.map(item => `<li style="margin: 8px 0;">${item}</li>`).join('')}
    </ul>
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/admin" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
        Process Return
      </a>
    </center>
  `;

  return sendEmail({
    to,
    subject: `Return Request - Order #${orderId}`,
    html: baseTemplate(content, 'Return Request'),
  });
}

// New order notification for admin
export async function sendNewOrderNotification({
  to,
  orderId,
  customerName,
  customerEmail,
  total,
  items,
}: {
  to: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: string[];
}) {
  const content = `
    <h2>New Order Received!</h2>
    <p>You have received a new order:</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Customer:</strong> ${customerName}<br>
      <strong>Email:</strong> ${customerEmail}<br>
      <strong>Total:</strong> AU$${total.toFixed(2)}<br>
    </div>
    
    <h3>Items:</h3>
    <ul style="padding-left: 20px; color: #34525a;">
      ${items.map(item => `<li style="margin: 8px 0;">${item}</li>`).join('')}
    </ul>
    
    <center>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/admin" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
        View Order
      </a>
    </center>
  `;

  return sendEmail({
    to,
    subject: `New Order - #${orderId} - AU$${total.toFixed(2)}`,
    html: baseTemplate(content, 'New Order'),
  });
}

// Email verification email
export async function sendVerificationEmail({
  to,
  customerName,
  verificationToken,
  baseUrl,
}: {
  to: string;
  customerName: string;
  verificationToken: string;
  baseUrl?: string;
}) {
  const verificationUrl = `${baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/verify-email?token=${verificationToken}`;
  
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${customerName},</p>
    <p>Thank you for registering with All Remotes! Please verify your email address to complete your registration.</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>Why verify?</strong><br>
      Verifying your email helps us ensure the security of your account and allows you to receive important notifications about your orders.
    </div>
    
    <center>
      <a href="${verificationUrl}" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">Verify Email Address</a>
    </center>
    
    <p style="margin-top: 20px; font-size: 13px; color: #67777d;">Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #67777d;">${verificationUrl}</p>
    
    <hr class="divider" style="height:1px;background:#eee8e1;margin:28px 0;border:none;" />
    
    <p style="font-size: 13px; color: #67777d;">
      This link will expire in 24 hours. If you didn't create an account with All Remotes, please ignore this email.
    </p>
  `;

  return sendEmail({
    to,
    subject: 'Verify Your Email Address - All Remotes',
    html: baseTemplate(content, 'Email Verification'),
  });
}

// Payment request email with Stripe checkout link
export function getPaymentRequestEmailHtml({
  orderId,
  customerName,
  total,
  paymentUrl,
  message,
}: {
  orderId: string;
  customerName: string;
  total: number;
  paymentUrl: string;
  message?: string;
}) {
  const noteHtml = message?.trim()
    ? `<div class="info-box" style="background:#e8f5f3;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;"><strong>Message from All Remotes:</strong><br>${message.replace(/\n/g, '<br>')}</div>`
    : '';

  const content = `
    <h2>Payment required for order #${orderId}</h2>
    <p>Hi ${customerName},</p>
    <p>We are ready to process your order. Please complete payment using the secure link below:</p>
    
    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Amount Due:</strong> AU$${total.toFixed(2)}
    </div>

    ${noteHtml}
    
    <center>
      <a href="${paymentUrl}" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">Pay AU$${total.toFixed(2)} Now</a>
    </center>
    
    <hr class="divider" style="height:1px;background:#eee8e1;margin:28px 0;border:none;" />
    
    <p style="word-break: break-all; font-size: 12px; color: #67777d;">
      If the button does not work, copy this link:<br>${paymentUrl}
    </p>
    
    <div class="contact-section" style="background:#f4efe8;padding:20px;border-radius:10px;margin-top:26px;text-align:center;">
      <p>Questions? We're here to help!</p>
      <p><a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a></p>
    </div>
  `;

  return baseTemplate(content, 'Payment Required');
}

export async function sendPaymentRequestEmail({
  to,
  orderId,
  customerName,
  total,
  paymentUrl,
  message,
}: {
  to: string;
  orderId: string;
  customerName: string;
  total: number;
  paymentUrl: string;
  message?: string;
}) {
  const html = getPaymentRequestEmailHtml({ orderId, customerName, total, paymentUrl, message });

  return sendEmail({
    to,
    subject: `Payment Required - Order #${orderId}`,
    html,
  });
}

// Review request email — asks customer to leave a Google review after delivered order
const GOOGLE_REVIEW_URL = "https://g.page/r/CWQhp-OLluk4EAI/review";

export async function sendReviewRequestEmail({
  to,
  orderId,
  customerName,
}: {
  to: string;
  orderId: string;
  customerName: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au';

  const content = `
    <h2>How did we do, ${customerName}?</h2>
    <p>Your order <strong>#${orderId}</strong> has been delivered! We'd love to hear your feedback.</p>

    <div class="info-box" style="background:#f4efe8;border-left:5px solid #1A7A6E;padding:20px 22px;border-radius:10px;margin:22px 0;color:#17353a;font-size:16px;line-height:1.8;">
      <strong>How was your experience with All Remotes?</strong><br><br>
      <strong>Shipping:</strong> Was your order delivered quickly and safely?<br>
      <strong>Product:</strong> Is your remote working as expected?<br>
      <strong>Service:</strong> Were you happy with our customer support?<br>
      <strong>Quality:</strong> Does the product meet your expectations?<br><br>
      Your feedback helps us improve and helps other customers make informed decisions.
    </div>

    <center>
      <a href="${GOOGLE_REVIEW_URL}" class="button" style="display:inline-block;padding:16px 40px;background-color:#C0392B;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:17px;">
        Leave a Google Review
      </a>
    </center>

    <p style="margin-top:20px;text-align:center;font-size:14px;color:#67777d;">
      It only takes a minute and makes a big difference to our small business.
    </p>

    <hr class="divider" style="height:1px;background:#eee8e1;margin:28px 0;border:none;" />

    <div class="contact-section" style="background:#f4efe8;padding:20px;border-radius:10px;margin-top:26px;text-align:center;">
      <p>Have an issue with your order? We're here to help!</p>
      <p><a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a></p>
      <p style="font-size:13px;color:#67777d;">All products come with a 12-month warranty.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `How was your experience with All Remotes? — Order #${orderId}`,
    html: baseTemplate(content, 'Share Your Feedback'),
  });
}

// Test email configuration
export async function testEmailConfiguration() {
  const transporter = createTransporter();
  
  if (!transporter) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'Email configuration verified successfully' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify email configuration' 
    };
  }
}
