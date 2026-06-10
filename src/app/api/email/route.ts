import { NextResponse } from 'next/server';
import {
  sendEmail,
  sendOrderConfirmationEmail,
  sendShippingUpdateEmail,
  sendOrderDeliveredEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLowStockNotification,
  sendReturnRequestEmail,
  sendNewOrderNotification,
  testEmailConfiguration,
} from '../../../lib/email';

// POST /api/email - Send an email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    let result;

    switch (type) {
      case 'order-confirmation':
        result = await sendOrderConfirmationEmail(data);
        break;
      case 'shipping-update':
        result = await sendShippingUpdateEmail(data);
        break;
      case 'order-delivered':
        result = await sendOrderDeliveredEmail(data);
        break;
      case 'password-reset':
        result = await sendPasswordResetEmail(data);
        break;
      case 'welcome':
        result = await sendWelcomeEmail(data);
        break;
      case 'low-stock':
        result = await sendLowStockNotification(data);
        break;
      case 'return-request':
        result = await sendReturnRequestEmail(data);
        break;
      case 'new-order':
        result = await sendNewOrderNotification(data);
        break;
      case 'custom':
        result = await sendEmail(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET /api/email/test - Test email configuration
export async function GET() {
  try {
    const result = await testEmailConfiguration();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing email configuration:', error);
    return NextResponse.json(
      { error: 'Failed to test email configuration' },
      { status: 500 }
    );
  }
}
