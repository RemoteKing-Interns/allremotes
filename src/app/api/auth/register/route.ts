import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongo';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail, sendVerificationEmail } from '../../../../lib/email';
import { validatePassword } from '../../../../lib/password-policy';
import { generateVerificationToken, hashToken } from '../../../../lib/email-verification';

const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const SALT_ROUNDS = 10;

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
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

    // Validate password strength with strict policy
    const passwordValidation = validatePassword(password, name, email);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet security requirements',
          passwordErrors: passwordValidation.errors,
          passwordRequirements: passwordValidation
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists (email/password provider)
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
      provider: 'email'
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    // Create new user
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      provider: 'email',
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry: verificationExpiry.toISOString(),
      notifications: {
        email: {
          orderUpdates: true,
          shippingUpdates: true,
          promotions: false,
          newsletters: true,
          reviews: true
        }
      }
    };

    const result = await usersCollection.insertOne(newUser);

    // Send welcome email (don't wait for it)
    sendWelcomeEmail({
      to: newUser.email,
      customerName: newUser.name
    }).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    // Send verification email (don't wait for it)
    sendVerificationEmail({
      to: newUser.email,
      customerName: newUser.name,
      verificationToken,
    }).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    // Return user data (without password)
    const userResponse = {
      id: result.insertedId.toString(),
      name: newUser.name,
      email: newUser.email,
      provider: newUser.provider,
      role: newUser.role,
      createdAt: newUser.createdAt,
      notifications: newUser.notifications
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Registration successful. Please check your email to verify your account.',
      verificationRequired: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
