import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import { generateVerificationToken, hashToken, getTokenExpiry } from '../../../../lib/email-verification';

/**
 * POST /api/auth/verify-email - Verify email with token
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Hash the provided token for comparison
    const hashedToken = hashToken(token);

    // Find user with matching verification token
    const user = await usersCollection.findOne({
      verificationToken: hashedToken,
      emailVerified: false,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
      return NextResponse.json(
        { success: false, error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark email as verified and clear verification token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date().toISOString(),
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpiry: '',
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email: user.email,
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/verify-email - Resend verification email
 */
export async function PUT(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      provider: 'email',
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = hashToken(verificationToken);
    const expiryDate = getTokenExpiry();

    // Update user with new verification token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationToken: hashedToken,
          verificationTokenExpiry: expiryDate.toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Send verification email
    const { sendVerificationEmail } = await import('../../../../lib/email');
    await sendVerificationEmail({
      to: user.email,
      customerName: user.name,
      verificationToken,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
