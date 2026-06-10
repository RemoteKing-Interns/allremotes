import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find user by email (email/password provider)
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      provider: 'email'
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please verify your email before logging in. Check your inbox for the verification link.',
          emailNotVerified: true,
          email: user.email
        },
        { status: 403 }
      );
    }

    // Return user data (without password)
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      provider: user.provider,
      role: user.role || 'customer',
      createdAt: user.createdAt,
      notifications: user.notifications || {
        email: {
          orderUpdates: true,
          shippingUpdates: true,
          promotions: false,
          newsletters: true,
          reviews: true
        }
      }
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
