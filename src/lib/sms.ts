/**
 * ClickSend SMS API Integration
 * Docs: https://developers.clicksend.com/
 *
 * Required env vars:
 *   CLICKSEND_USERNAME - Your ClickSend username
 *   CLICKSEND_API_KEY - Your ClickSend API key
 *   CLICKSEND_FROM - Sender ID (optional, defaults to phone number)
 */

// ClickSend configuration
const CLICKSEND_USERNAME = process.env.CLICKSEND_USERNAME || '';
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY || '';
const CLICKSEND_FROM = process.env.CLICKSEND_FROM || 'AllRemotes';

const CLICKSEND_BASE_URL = 'https://rest.clicksend.com/v3';

// Check if SMS is configured
export const isSmsConfigured = (): boolean => {
  return !!(CLICKSEND_USERNAME && CLICKSEND_API_KEY);
};

// ClickSend API request helper
const clicksendRequest = async (endpoint: string, method: string, body?: any) => {
  if (!isSmsConfigured()) {
    throw new Error('ClickSend not configured. Set CLICKSEND_USERNAME and CLICKSEND_API_KEY environment variables.');
  }

  const auth = Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_API_KEY}`).toString('base64');

  const response = await fetch(`${CLICKSEND_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ClickSend API error: ${response.status} ${error}`);
  }

  return response.json();
};

// Send single SMS
export async function sendSms({
  to,
  message,
  from = CLICKSEND_FROM,
}: {
  to: string;
  message: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isSmsConfigured()) {
      console.warn('SMS not configured. Message not sent:', message);
      return { success: false, error: 'SMS not configured' };
    }

    // Clean phone number (remove spaces, ensure + prefix)
    const cleanNumber = to.replace(/\s/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+61${cleanNumber.replace(/^0/, '')}`;

    // Debug: log what we're sending
    console.log('[SMS] CLICKSEND_FROM env value:', CLICKSEND_FROM);
    console.log('[SMS] Using sender ID:', from || '(empty - ClickSend will use shared number)');

    const result = await clicksendRequest('/sms/send', 'POST', {
      messages: [
        {
          to: formattedNumber,
          body: message,
          // Only include 'from' if it's set and not empty
          ...(from && from.trim() ? { from: from.trim() } : {}),
        },
      ],
    });

    // Debug: log full response
    console.log('[SMS] ClickSend API response:', JSON.stringify(result, null, 2));

    const messageResult = result?.data?.messages?.[0];
    console.log('[SMS] Message result:', messageResult);

    if (messageResult?.status === 'SUCCESS') {
      console.log('[SMS] Sent successfully with sender:', messageResult.from || 'shared number');
      return {
        success: true,
        messageId: messageResult.message_id,
      };
    }

    // Check for sender ID rejection
    if (messageResult?.status?.includes('INVALID_SENDER') || messageResult?.status?.includes('REJECTED')) {
      console.warn('[SMS] Sender ID rejected by ClickSend. You need to whitelist "' + from + '" in your ClickSend dashboard.');
    }

    return {
      success: false,
      error: messageResult?.status || 'Unknown error',
    };
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error?.message || 'Failed to send SMS',
    };
  }
}

// Send bulk SMS
export async function sendBulkSms({
  recipients,
  message,
  from = CLICKSEND_FROM,
}: {
  recipients: string[];
  message: string;
  from?: string;
}): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
  try {
    if (!isSmsConfigured()) {
      console.warn('SMS not configured. Bulk message not sent to', recipients.length, 'recipients');
      return { success: false, sent: 0, failed: recipients.length, error: 'SMS not configured' };
    }

    const messages = recipients.map((to) => {
      const cleanNumber = to.replace(/\s/g, '');
      const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+61${cleanNumber.replace(/^0/, '')}`;
      return {
        to: formattedNumber,
        body: message,
        from: from,
      };
    });

    const result = await clicksendRequest('/sms/send', 'POST', { messages });

    const results = result?.data?.messages || [];
    const sent = results.filter((m: any) => m.status === 'SUCCESS').length;
    const failed = results.length - sent;

    return {
      success: failed === 0,
      sent,
      failed,
    };
  } catch (error: any) {
    console.error('Failed to send bulk SMS:', error);
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      error: error?.message || 'Failed to send bulk SMS',
    };
  }
}

// Get account balance
export async function getSmsBalance(): Promise<{ balance: number; currency: string } | null> {
  try {
    if (!isSmsConfigured()) {
      return null;
    }

    const result = await clicksendRequest('/account', 'GET');
    return {
      balance: result?.data?.balance || 0,
      currency: result?.data?.currency || 'AUD',
    };
  } catch (error) {
    console.error('Failed to get SMS balance:', error);
    return null;
  }
}

// SMS Templates for common use cases
export const smsTemplates = {
  orderConfirmation: (orderId: string, total: string) =>
    `Your All Remotes order ${orderId} has been received. Total: ${total}. We'll notify you when it ships.`,

  orderShipped: (orderId: string, trackingNumber?: string) =>
    trackingNumber
      ? `Great news! Order ${orderId} has shipped. Track it: ${trackingNumber}. All Remotes`
      : `Great news! Order ${orderId} has shipped and is on its way. All Remotes`,

  orderDelivered: (orderId: string) =>
    `Your order ${orderId} has been delivered. Thanks for shopping with All Remotes!`,

  passwordReset: (code: string) =>
    `Your All Remotes password reset code is: ${code}. This code expires in 1 hour.`,

  verificationCode: (code: string) =>
    `Your All Remotes verification code is: ${code}. This code expires in 10 minutes.`,

  lowStockAlert: (sku: string, productName: string) =>
    `STOCK ALERT: ${productName} (${sku}) is running low. Please restock soon.`,
};

// Send order confirmation SMS
export async function sendOrderConfirmationSms(
  to: string,
  orderId: string,
  total: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendSms({
    to,
    message: smsTemplates.orderConfirmation(orderId, total),
  });
}

// Send order shipped SMS
export async function sendOrderShippedSms(
  to: string,
  orderId: string,
  trackingNumber?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendSms({
    to,
    message: smsTemplates.orderShipped(orderId, trackingNumber),
  });
}

// Send order delivered SMS
export async function sendOrderDeliveredSms(
  to: string,
  orderId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendSms({
    to,
    message: smsTemplates.orderDelivered(orderId),
  });
}
