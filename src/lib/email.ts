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

// Brand palette shared across all emails
const BRAND = {
  red: '#C0392B',
  teal: '#1A7A6E',
  amber: '#d97706',
  ink: '#1f2937',
  muted: '#6b7280',
  faint: '#9ca3af',
  line: '#e5e7eb',
  tint: '#f8f7f5',
  pageBg: '#f4f4f5',
  greenBg: '#dcfce7',
  greenText: '#15803d',
  blueBg: '#dbeafe',
  blueText: '#1d4ed8',
};

// Reusable content blocks — keep every email consistent and client-safe (all inline styles)
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

export const emailInfoBox = (inner: string, borderColor = BRAND.teal) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
  <tr><td style="background:${BRAND.tint};border-left:4px solid ${borderColor};border-radius:8px;padding:18px 20px;font-size:15px;line-height:1.8;color:${BRAND.ink};">${inner}</td></tr>
</table>`;

export const emailCta = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto;">
  <tr><td align="center" bgcolor="${BRAND.red}" style="border-radius:10px;">
    <a href="${href}" style="display:inline-block;padding:15px 42px;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.2px;">${label}</a>
  </td></tr>
</table>`;

export const emailDivider = `<hr style="border:none;border-top:1px solid ${BRAND.line};margin:28px 0;" />`;

export const emailContactBlock = () => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;">
  <tr><td align="center" style="background:${BRAND.tint};border-radius:8px;padding:18px 20px;">
    <p style="margin:0 0 6px;font-size:14px;color:${BRAND.ink};font-weight:600;">Questions? We're here to help.</p>
    <p style="margin:0;font-size:14px;"><a href="mailto:shane@allremotes.com.au" style="color:${BRAND.teal};font-weight:700;text-decoration:none;">shane@allremotes.com.au</a></p>
  </td></tr>
</table>`;

const stepPill = (label: string, state: 'done' | 'current' | 'todo') => {
  const colors = { done: `background:${BRAND.greenBg};color:${BRAND.greenText};`, current: `background:${BRAND.blueBg};color:${BRAND.blueText};`, todo: `background:#f3f4f6;color:${BRAND.faint};` }[state];
  const mark = state === 'done' ? '✓ ' : state === 'current' ? '● ' : '○ ';
  return `<span style="display:inline-block;padding:7px 16px;border-radius:999px;font-size:13px;font-weight:700;${colors}">${mark}${label}</span>`;
};

// Ordered → Shipped → Delivered progress row
const emailStepsBar = (current: 'shipped' | 'delivered') => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 6px;">
  <tr>
    <td align="right">${stepPill('Ordered', 'done')}</td>
    <td align="center" width="26" style="color:${BRAND.faint};font-size:15px;">→</td>
    <td align="center">${stepPill('Shipped', current === 'shipped' ? 'current' : 'done')}</td>
    <td align="center" width="26" style="color:${BRAND.faint};font-size:15px;">→</td>
    <td align="left">${stepPill('Delivered', current === 'delivered' ? 'current' : 'todo')}</td>
  </tr>
</table>`;

// Base email template — branded, table-based layout for email client compatibility
export const baseTemplate = (content: string, title: string, preheader = '') => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - All Remotes</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND.pageBg}; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    h2 { color: ${BRAND.ink}; font-size: 24px; font-weight: 800; margin: 0 0 16px; line-height: 1.3; }
    h3 { color: ${BRAND.ink}; font-size: 17px; font-weight: 700; margin: 24px 0 10px; }
    p { color: #444; font-size: 15px; line-height: 1.7; margin: 12px 0; }
    a { color: ${BRAND.teal}; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.pageBg};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.pageBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <a href="${siteUrl}" style="text-decoration:none;"><img src="${siteUrl}/images/mainlogo.png" alt="All Remotes" width="170" style="display:block;max-width:170px;height:auto;margin:0 auto;border:0;" /></a>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:14px;padding:34px 32px;font-family:${FONT};font-size:15px;line-height:1.7;color:${BRAND.ink};">
              <p style="margin:0 0 22px;font-size:11px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:${BRAND.teal};text-align:center;">${title}</p>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 8px;font-family:${FONT};">
              <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};">
                <a href="mailto:shane@allremotes.com.au" style="color:${BRAND.teal};text-decoration:none;font-weight:600;">shane@allremotes.com.au</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl}" style="color:${BRAND.teal};text-decoration:none;font-weight:600;">allremotes.com.au</a>
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.faint};">&copy; ${new Date().getFullYear()} All Remotes. All rights reserved.</p>
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
  const th = `padding:10px 12px;text-align:left;background:${BRAND.tint};color:${BRAND.ink};font-weight:700;font-size:13px;border-bottom:1px solid ${BRAND.line};`;
  const td = `padding:10px 12px;border-bottom:1px solid ${BRAND.line};font-size:14px;color:#444;`;
  const itemsHtml = items.map(item => `
    <tr>
      <td style="${td}">${item.name}</td>
      <td style="${td}text-align:center;">${item.quantity}</td>
      <td style="${td}text-align:right;">AU$${item.price.toFixed(2)}</td>
      <td style="${td}text-align:right;">AU$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Thank you for your order, ${customerName}!</h2>
    <p>Your order has been received and is being processed. We'll let you know as soon as it's on its way.</p>

    ${emailInfoBox(`
      <strong style="color:${BRAND.teal};">Order:</strong> #${orderId}<br>
      <strong style="color:${BRAND.teal};">Date:</strong> ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
    `)}

    <h3>Order Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0;">
      <thead>
        <tr>
          <th style="${th}">Product</th>
          <th style="${th}text-align:center;">Qty</th>
          <th style="${th}text-align:right;">Price</th>
          <th style="${th}text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:12px;text-align:right;font-size:15px;font-weight:700;color:${BRAND.ink};">Total</td>
          <td style="padding:12px;text-align:right;font-size:16px;font-weight:800;color:${BRAND.red};">AU$${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <h3>Shipping Address</h3>
    ${emailInfoBox(shippingAddress.replace(/\n/g, '<br>'))}

    ${emailCta(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au'}/account/orders`, 'View Order Details')}

    ${emailContactBlock()}
  `;

  return sendEmail({
    to,
    subject: `Order Confirmation #${orderId}`,
    html: baseTemplate(content, 'Order Confirmed', `Order #${orderId} received — thank you, ${customerName}!`),
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
  const isShipped = /ship|transit/i.test(status);

  const content = `
    <h2>Your order is on its way!</h2>
    <p>Hi ${customerName}, great news — order <strong>#${orderId}</strong> has been updated to <strong style="color:${BRAND.red};">${status}</strong>.</p>

    ${emailStepsBar(isShipped ? 'shipped' : 'delivered')}

    ${emailInfoBox(`
      ${carrier ? `<strong style="color:${BRAND.teal};">Carrier:</strong> ${carrier}<br>` : ''}
      ${trackingNumber ? `<strong style="color:${BRAND.teal};">Tracking:</strong> <span style="font-family:Consolas,Menlo,monospace;font-size:14px;">${trackingNumber}</span><br>` : ''}
      ${estimatedDelivery ? `<strong style="color:${BRAND.teal};">Estimated Delivery:</strong> ${estimatedDelivery}` : ''}
    `)}

    ${trackUrl ? emailCta(trackUrl, 'Track Your Package') : ''}

    <p style="font-size:13px;color:${BRAND.muted};">Tracking can take up to 24 hours to show its first scan — if the link shows nothing yet, check back shortly.</p>

    ${emailContactBlock()}
  `;

  return sendEmail({
    to,
    subject: `Your order #${orderId} has shipped`,
    html: baseTemplate(content, 'Shipping Update', `Order #${orderId} is on its way — track it inside`),
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
    <h2>Your order has been delivered!</h2>
    <p>Hi ${customerName}, order <strong>#${orderId}</strong> was delivered on <strong style="color:${BRAND.red};">${deliveredDate}</strong>.</p>

    ${emailStepsBar('delivered')}

    ${emailInfoBox(`
      We hope you enjoy your purchase! If anything isn't right, just reply to this email — all products are covered by our <strong>12-month warranty</strong>.
    `)}

    <p style="text-align:center;font-size:14px;color:${BRAND.muted};">Happy with your remote? A quick Google review helps other Aussies find us — it only takes a minute.</p>

    ${emailCta(GOOGLE_REVIEW_URL, 'Leave a Google Review')}

    ${emailCta(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au'}/account/orders`, 'View Your Order')}

    ${emailContactBlock()}
  `;

  return sendEmail({
    to,
    subject: `Order #${orderId} delivered`,
    html: baseTemplate(content, 'Order Delivered', `Order #${orderId} has arrived — we hope you love it`),
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
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au';
  const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${customerName}, we received a request to reset the password for your All Remotes account. Click below to set a new one:</p>

    ${emailCta(resetUrl, 'Reset My Password')}

    <p style="text-align:center;font-size:13px;color:${BRAND.muted};margin-top:4px;">Or copy and paste this link:</p>
    <div style="background:${BRAND.tint};padding:12px;border-radius:6px;margin:12px 0;word-break:break-all;font-size:12px;color:${BRAND.muted};">${resetUrl}</div>

    ${emailInfoBox(`<strong style="color:${BRAND.amber};">Important:</strong> This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.`, BRAND.amber)}

    ${emailContactBlock()}
  `;

  return sendEmail({
    to,
    subject: 'Password Reset Request - All Remotes',
    html: baseTemplate(content, 'Password Reset', `Reset your All Remotes password — link expires in 1 hour`),
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au';

  const content = `
    <h2>Welcome to All Remotes!</h2>
    <p>Hi ${customerName}, thanks for creating an account — we're excited to have you on board.</p>

    ${emailInfoBox(`
      <strong style="color:${BRAND.teal};">What you can do now:</strong>
      <ul style="margin:12px 0 0;padding-left:22px;color:#444;font-size:15px;">
        <li style="margin:8px 0;">Browse our full range of remotes and accessories</li>
        <li style="margin:8px 0;">Save favourites to your wishlist</li>
        <li style="margin:8px 0;">Track your orders from your account</li>
        <li style="margin:8px 0;">Get exclusive offers and promotions</li>
      </ul>
    `)}

    ${emailCta(`${siteUrl}/products/all`, 'Start Shopping')}

    ${emailContactBlock()}
  `;

  return sendEmail({
    to,
    subject: 'Welcome to All Remotes!',
    html: baseTemplate(content, 'Welcome', `Welcome to All Remotes, ${customerName} — your account is ready`),
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

    ${emailInfoBox(`
      <strong style="color:${BRAND.teal};">Product:</strong> ${productName}<br>
      <strong style="color:${BRAND.teal};">SKU:</strong> <span style="font-family:Consolas,Menlo,monospace;font-size:14px;">${sku}</span><br>
      <strong style="color:${BRAND.teal};">Current Stock:</strong> <span style="color:${BRAND.red};font-weight:700;">${currentStock}</span>
    `, BRAND.amber)}

    ${emailCta(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au'}/admin`, 'Manage Inventory')}
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

    ${emailInfoBox(`
      <strong style="color:${BRAND.teal};">Order ID:</strong> #${orderId}<br>
      <strong style="color:${BRAND.teal};">Customer:</strong> ${customerName}<br>
      <strong style="color:${BRAND.teal};">Email:</strong> ${customerEmail}<br>
      <strong style="color:${BRAND.teal};">Reason:</strong> ${reason}
    `)}

    <h3>Items to Return</h3>
    <ul style="padding-left:20px;color:#444;font-size:15px;">
      ${items.map(item => `<li style="margin:8px 0;">${item}</li>`).join('')}
    </ul>

    ${emailCta(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au'}/admin`, 'Process Return')}
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
    <h2>New Order Received</h2>
    <p>You have received a new order:</p>

    ${emailInfoBox(`
      <strong style="color:${BRAND.teal};">Order ID:</strong> #${orderId}<br>
      <strong style="color:${BRAND.teal};">Customer:</strong> ${customerName}<br>
      <strong style="color:${BRAND.teal};">Email:</strong> ${customerEmail}<br>
      <strong style="color:${BRAND.teal};">Total:</strong> <span style="color:${BRAND.red};font-weight:700;">AU$${total.toFixed(2)}</span>
    `)}

    <h3>Items</h3>
    <ul style="padding-left:20px;color:#444;font-size:15px;">
      ${items.map(item => `<li style="margin:8px 0;">${item}</li>`).join('')}
    </ul>

    ${emailCta(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au'}/admin`, 'View Order')}
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
  const verificationUrl = `${baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au'}/verify-email?token=${verificationToken}`;
  
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${customerName}, thanks for registering with All Remotes! Please verify your email address to complete your registration.</p>

    ${emailCta(verificationUrl, 'Verify Email Address')}

    <p style="text-align:center;font-size:13px;color:${BRAND.muted};margin-top:4px;">Or copy and paste this link into your browser:</p>
    <div style="background:${BRAND.tint};padding:12px;border-radius:6px;margin:12px 0;word-break:break-all;font-size:12px;color:${BRAND.muted};">${verificationUrl}</div>

    ${emailDivider}

    <p style="font-size:13px;color:${BRAND.muted};">
      This link will expire in <strong>24 hours</strong>. If you didn't create an account with All Remotes, you can safely ignore this email.
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
    ? emailInfoBox(`<strong style="color:${BRAND.teal};">Message from All Remotes:</strong><br>${message.replace(/\n/g, '<br>')}`)
    : '';

  const content = `
    <h2>Payment Required — Order #${orderId}</h2>
    <p>Hi ${customerName}, we're ready to process your order. Please complete payment using the secure link below:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
      <tr><td align="center" style="background:${BRAND.tint};border:1px solid ${BRAND.line};border-radius:10px;padding:20px;">
        <p style="margin:0;font-size:13px;color:${BRAND.muted};">Order #${orderId}</p>
        <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:${BRAND.red};">AU$${total.toFixed(2)}</p>
      </td></tr>
    </table>

    ${noteHtml}

    ${emailCta(paymentUrl, `Pay AU$${total.toFixed(2)} Now`)}

    <p style="word-break:break-all;font-size:12px;color:${BRAND.muted};text-align:center;">
      If the button does not work, copy this link:<br>${paymentUrl}
    </p>

    ${emailContactBlock()}
  `;

  return baseTemplate(content, 'Payment Required', `Action needed — payment for order #${orderId}`);
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allremotes.com.au';

  const content = `
    <h2>How did we do, ${customerName}?</h2>
    <p>Your order <strong>#${orderId}</strong> has been delivered — we'd love to hear your feedback.</p>

    ${emailInfoBox(`
      <strong style="color:${BRAND.teal};">Shipping</strong> — was your order delivered quickly and safely?<br>
      <strong style="color:${BRAND.teal};">Product</strong> — is your remote working as expected?<br>
      <strong style="color:${BRAND.teal};">Service</strong> — were you happy with our customer support?
    `)}

    ${emailCta(GOOGLE_REVIEW_URL, 'Leave a Google Review')}

    <p style="text-align:center;font-size:13px;color:${BRAND.muted};">
      It only takes a minute and makes a big difference to our small business.
    </p>

    ${emailContactBlock()}

    <p style="text-align:center;font-size:12px;color:${BRAND.faint};">All products come with a 12-month warranty.</p>
  `;

  return sendEmail({
    to,
    subject: `How was your experience with All Remotes? — Order #${orderId}`,
    html: baseTemplate(content, 'Share Your Feedback', `Order #${orderId} delivered — tell us how we did`),
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
