import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import bcrypt from 'bcryptjs';
import { serverLogger } from '../../../../lib/server-logger';

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

    // Check admin_users first (invited admins have hashed passwords, no provider field)
    const adminUser = await db.collection('admin_users').findOne({ email: email.toLowerCase() });
    if (adminUser && adminUser.password) {
      const isValid = await bcrypt.compare(password, adminUser.password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      const userResponse = {
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: 'admin',
        permissions: adminUser.permissions || ['*'],
        twoFactorEnabled: !!adminUser.twoFactorEnabled,
        createdAt: adminUser.createdAt,
      };
      await serverLogger.info('admin_login', { email, name: adminUser.name }, { userEmail: email, ip: (request as any).headers?.get?.('x-forwarded-for') || 'unknown' });
      return NextResponse.json({ success: true, user: userResponse, message: 'Login successful' });
    }

    // Fall through to customer users
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
      await serverLogger.warn('login_failed', { email, reason: 'invalid_password' }, { userEmail: email });
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

    await serverLogger.info('customer_login', { email, name: user.name }, { userEmail: email });
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
