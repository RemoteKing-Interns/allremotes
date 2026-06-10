// Client-side email service
// Use this from React components to send emails via the API

export type EmailType = 
  | 'order-confirmation'
  | 'shipping-update'
  | 'order-delivered'
  | 'password-reset'
  | 'welcome'
  | 'low-stock'
  | 'return-request'
  | 'new-order'
  | 'custom';

interface SendEmailOptions {
  type: EmailType;
  data: Record<string, any>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via the API
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/email');
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Email configuration test failed',
      };
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Error testing email config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(testEmail: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/admin/email-settings/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send test email',
      };
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Preset email functions for common use cases

/**
 * Send order confirmation to customer
 */
export async function sendOrderConfirmation(
  to: string,
  orderData: {
    orderId: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'order-confirmation',
    data: { to, ...orderData },
  });
}

/**
 * Send shipping update to customer
 */
export async function sendShippingUpdate(
  to: string,
  data: {
    orderId: string;
    customerName: string;
    trackingNumber?: string;
    carrier?: string;
    status: string;
    estimatedDelivery?: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'shipping-update',
    data: { to, ...data },
  });
}

/**
 * Send order delivered notification
 */
export async function sendOrderDelivered(
  to: string,
  data: {
    orderId: string;
    customerName: string;
    deliveredDate: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'order-delivered',
    data: { to, ...data },
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  to: string,
  customerName: string
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'welcome',
    data: { to, customerName },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  to: string,
  data: {
    resetToken: string;
    customerName: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'password-reset',
    data: { to, ...data },
  });
}

/**
 * Send low stock alert to admin
 */
export async function sendLowStockAlert(
  adminEmail: string,
  data: {
    productName: string;
    sku: string;
    currentStock: number;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'low-stock',
    data: { to: adminEmail, ...data },
  });
}

/**
 * Send new order notification to admin
 */
export async function sendNewOrderNotification(
  adminEmail: string,
  data: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
    items: string[];
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'new-order',
    data: { to: adminEmail, ...data },
  });
}

/**
 * Send return request notification to admin
 */
export async function sendReturnRequestNotification(
  adminEmail: string,
  data: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    reason: string;
    items: string[];
  }
): Promise<SendEmailResult> {
  return sendEmail({
    type: 'return-request',
    data: { to: adminEmail, ...data },
  });
}
