import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import crypto from 'crypto';
import { sendSms, isSmsConfigured } from '../../../../lib/sms';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP for storage
function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// OTP expiry (10 minutes)
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * POST /api/auth/verify-phone - Send OTP to phone
 */
export async function POST(request: Request) {
  try {
    const { phone, email } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!isSmsConfigured()) {
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\s/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+61${cleanPhone.replace(/^0/, '')}`;

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiryDate = new Date(Date.now() + OTP_EXPIRY_MS);

    const db = await getDb();
    const usersCollection = db.collection('users');

    // If email provided, store OTP against user
    if (email) {
      await usersCollection.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            phoneOtp: hashedOTP,
            phoneOtpExpiry: expiryDate.toISOString(),
            tempPhone: formattedPhone,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    } else {
      // Store in a temporary collection for non-logged in users
      const tempCollection = db.collection('phone_verifications');
      await tempCollection.updateOne(
        { phone: formattedPhone },
        {
          $set: {
            otp: hashedOTP,
            expiry: expiryDate.toISOString(),
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }

    // Send OTP via SMS
    const message = `Your All Remotes verification code is: ${otp}. This code expires in 10 minutes.`;
    const smsResult = await sendSms({ to: formattedPhone, message });

    if (!smsResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS: ' + smsResult.error },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      phone: formattedPhone,
    }, { headers: CORS_HEADERS });

  } catch (error: any) {
    console.error('Phone verification send error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to send verification code' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PUT /api/auth/verify-phone - Verify OTP
 */
export async function PUT(request: Request) {
  try {
    const { phone, otp, email } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+61${cleanPhone.replace(/^0/, '')}`;
    const hashedOTP = hashOTP(otp);

    const db = await getDb();
    const usersCollection = db.collection('users');

    let userRecord = null;
    let storedOTP = null;
    let expiryDate = null;

    // Check if user exists with this phone verification
    if (email) {
      userRecord = await usersCollection.findOne({
        email: email.toLowerCase(),
        phoneOtp: hashedOTP,
        tempPhone: formattedPhone,
      });

      if (userRecord) {
        storedOTP = userRecord.phoneOtp;
        expiryDate = userRecord.phoneOtpExpiry;
      }
    } else {
      // Check temp collection
      const tempCollection = db.collection('phone_verifications');
      const tempRecord = await tempCollection.findOne({
        phone: formattedPhone,
        otp: hashedOTP,
      });

      if (tempRecord) {
        storedOTP = tempRecord.otp;
        expiryDate = tempRecord.expiry;
      }
    }

    if (!storedOTP) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Check expiry
    if (expiryDate && new Date() > new Date(expiryDate)) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new one.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Update user record with verified phone
    if (email && userRecord) {
      await usersCollection.updateOne(
        { email: email.toLowerCase() },
        {
          $set: {
            phone: formattedPhone,
            phoneVerified: true,
            phoneVerifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          $unset: {
            phoneOtp: '',
            phoneOtpExpiry: '',
            tempPhone: '',
          },
        }
      );
    }

    // Clean up temp record
    const tempCollection = db.collection('phone_verifications');
    await tempCollection.deleteOne({ phone: formattedPhone });

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
      phone: formattedPhone,
    }, { headers: CORS_HEADERS });

  } catch (error: any) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to verify phone number' },
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
