import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../../../lib/email';

// Token expiration time (1 hour)
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate a secure reset token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash token for storage
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/auth/forgot-password - Request password reset
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find user by email (only email/password provider)
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      provider: 'email'
    });

    // For security, don't reveal if email exists or not
    // Always return success, but only send email if user exists
    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);
    const expiryDate = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    // Save reset token to user
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpiry: expiryDate.toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    );

    // Send password reset email
    await sendPasswordResetEmail({
      to: user.email,
      customerName: user.name,
      resetToken,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
