import nodemailer from 'nodemailer';

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

// Base email template
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; padding: 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    .info-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { font-weight: 600; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>All Remotes</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent from All Remotes.</p>
      <p>© ${new Date().getFullYear()} All Remotes. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

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
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>AU$${item.price.toFixed(2)}</td>
      <td>AU$${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Thank you for your order, ${customerName}!</h2>
    <p>Your order has been received and is being processed.</p>
    
    <div class="info-box">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Order Date:</strong> ${new Date().toLocaleDateString('en-AU')}
    </div>
    
    <h3>Order Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <p style="text-align: right; font-size: 18px; font-weight: bold;">
      Total: AU$${total.toFixed(2)}
    </p>
    
    <h3>Shipping Address</h3>
    <p>${shippingAddress.replace(/\n/g, '<br>')}</p>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/account/orders" class="button">
      View Order Details
    </a>
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
}: {
  to: string;
  orderId: string;
  customerName: string;
  trackingNumber?: string;
  carrier?: string;
  status: string;
  estimatedDelivery?: string;
}) {
  const content = `
    <h2>Shipping Update for Order #${orderId}</h2>
    <p>Hi ${customerName},</p>
    <p>Your order status has been updated to: <strong>${status}</strong></p>
    
    <div class="info-box">
      ${trackingNumber ? `<strong>Tracking Number:</strong> ${trackingNumber}<br>` : ''}
      ${carrier ? `<strong>Carrier:</strong> ${carrier}<br>` : ''}
      ${estimatedDelivery ? `<strong>Estimated Delivery:</strong> ${estimatedDelivery}<br>` : ''}
    </div>
    
    ${trackingNumber ? `
      <a href="https://www.google.com/search?q=${encodeURIComponent(trackingNumber + ' ' + (carrier || ''))}" class="button">
        Track Package
      </a>
    ` : ''}
    
    <p>If you have any questions about your order, please contact us at <a href="mailto:shane@allremotes.com.au">shane@allremotes.com.au</a>.</p>
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
    <p>Great news! Your order #${orderId} has been delivered on <strong>${deliveredDate}</strong>.</p>
    
    <div class="info-box">
      We hope you enjoy your purchase! If you have any issues with your order, please contact us — all products are covered by our 12-month warranty.
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/account/orders" class="button">
      Leave a Review
    </a>
    
    <p>Thank you for shopping with All Remotes!</p>
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
        <a href="${resetUrl}" class="button">Reset My Password</a>
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
      
      <div class="info-box">
        <strong>What you can do now:</strong>
        <ul>
          <li>Browse our extensive collection of remotes</li>
          <li>Save your favorite products to your wishlist</li>
          <li>Track your orders easily</li>
          <li>Get exclusive offers and promotions</li>
        </ul>
      </div>
      
      <center>
        <a href="${siteUrl}/products/all" class="button">
          Start Shopping
        </a>
      </center>
      
      <div class="contact-section">
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
    
    <div class="info-box">
      <strong>Product:</strong> ${productName}<br>
      <strong>SKU:</strong> ${sku}<br>
      <strong>Current Stock:</strong> ${currentStock}<br>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/admin" class="button">
      Manage Inventory
    </a>
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
    
    <div class="info-box">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Customer:</strong> ${customerName}<br>
      <strong>Email:</strong> ${customerEmail}<br>
      <strong>Reason:</strong> ${reason}<br>
    </div>
    
    <h3>Items to Return:</h3>
    <ul style="padding-left: 20px;">
      ${items.map(item => `<li>${item}</li>`).join('')}
    </ul>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/admin" class="button">
      Process Return
    </a>
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
    
    <div class="info-box">
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Customer:</strong> ${customerName}<br>
      <strong>Email:</strong> ${customerEmail}<br>
      <strong>Total:</strong> AU$${total.toFixed(2)}<br>
    </div>
    
    <h3>Items:</h3>
    <ul style="padding-left: 20px;">
      ${items.map(item => `<li>${item}</li>`).join('')}
    </ul>
    
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://allremotes.com.au'}/admin" class="button">
      View Order
    </a>
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
    
    <div class="info-box">
      <strong>Why verify?</strong><br>
      Verifying your email helps us ensure the security of your account and allows you to receive important notifications about your orders.
    </div>
    
    <a href="${verificationUrl}" class="button">Verify Email Address</a>
    
    <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${verificationUrl}</p>
    
    <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
      This link will expire in 24 hours. If you didn't create an account with All Remotes, please ignore this email.
    </p>
  `;

  return sendEmail({
    to,
    subject: 'Verify Your Email Address - All Remotes',
    html: baseTemplate(content, 'Email Verification'),
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
