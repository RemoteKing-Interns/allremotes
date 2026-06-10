import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

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

    // Check if email exists (any provider)
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase()
    });

    // Also check for OAuth users separately
    const existingOAuthUser = await usersCollection.findOne({
      email: email.toLowerCase(),
      provider: { $in: ['google', 'apple'] }
    });

    return NextResponse.json({
      success: true,
      available: !existingUser,
      email: email.toLowerCase(),
      exists: !!existingUser,
      provider: existingUser?.provider || null,
      isOAuth: !!existingOAuthUser,
      message: existingUser 
        ? existingOAuthUser 
          ? 'This email is registered with Google or Apple Sign In. Please use the social login buttons.'
          : 'This email is already registered. Please log in instead.'
        : 'Email is available'
    });

  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
