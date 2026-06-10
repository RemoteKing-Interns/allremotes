import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePassword } from '../../../../lib/password-policy';

const SALT_ROUNDS = 10;

/**
 * Hash token for comparison
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/auth/reset-password - Reset password with token
 */
export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet security requirements',
          passwordErrors: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Hash the provided token for comparison
    const hashedToken = hashToken(token);

    // Find user with matching reset token
    const user = await usersCollection.findOne({
      resetPasswordToken: hashedToken,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (user.resetPasswordExpiry && new Date() > new Date(user.resetPasswordExpiry)) {
      return NextResponse.json(
        { success: false, error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        },
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpiry: '',
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
