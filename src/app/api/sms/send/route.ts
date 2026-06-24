import { NextResponse } from 'next/server';
import { sendSms, isSmsConfigured } from '../../../../lib/sms';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: Request) {
  try {
    const { to, message, from } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number (to) and message are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!isSmsConfigured()) {
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const result = await sendSms({ to, message, from });

    if (result.success) {
      return NextResponse.json(
        { success: true, messageId: result.messageId },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500, headers: CORS_HEADERS }
    );

  } catch (error: any) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send SMS' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
