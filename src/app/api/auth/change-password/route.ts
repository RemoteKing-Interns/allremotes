import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../../../../lib/password-policy';

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    // Validation
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({
      _id: new (require('mongodb').ObjectId)(userId),
      provider: 'email'
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Validate new password strength with strict policy
    const passwordValidation = validatePassword(newPassword, user.name, user.email);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'New password does not meet security requirements',
          passwordErrors: passwordValidation.errors,
          passwordRequirements: passwordValidation
        },
        { status: 400 }
      );
    }

    // Check that new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password. Please try again.' },
      { status: 500 }
    );
  }
}
