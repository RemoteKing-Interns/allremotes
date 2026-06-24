import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongo';
import { sendWelcomeEmail } from '../../../lib/email';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://allremotes-admin.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request) {
  try {
    const userData = await request.json();
    
    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: userData.email,
      provider: userData.provider
    });

    if (existingUser) {
      // User exists, return existing user data
      return NextResponse.json({
        success: true,
        user: existingUser,
        isNew: false
      }, {
        headers: CORS_HEADERS
      });
    }

    // Create new user with default preferences
    const newUser = {
      ...userData,
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true, // OAuth emails are already verified
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
    
    // Send welcome email for new OAuth users
    sendWelcomeEmail({
      to: newUser.email,
      customerName: newUser.name
    }).catch(err => {
      console.error('Failed to send welcome email to OAuth user:', err);
    });
    
    return NextResponse.json({
      success: true,
      user: { ...newUser, _id: result.insertedId },
      isNew: true
    }, {
      headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const provider = searchParams.get('provider');

    const db = await getDb();
    const usersCollection = db.collection('users');

    // If no email provided, return all users (for admin panel)
    if (!email) {
      const users = await usersCollection
        .find({}, { projection: { password: 0, verificationToken: 0, resetPasswordToken: 0 } }) // Exclude sensitive fields
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({
        success: true,
        users
      }, {
        headers: CORS_HEADERS
      });
    }

    // Otherwise, find specific user by email
    const query = { email };
    if (provider) {
      query.provider = provider;
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { 
          status: 404,
          headers: CORS_HEADERS 
        }
      );
    }

    return NextResponse.json({
      success: true,
      user
    }, {
      headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

export async function PUT(request) {
  try {
    const { email, updates } = await request.json();

    if (!email || !updates) {
      return NextResponse.json(
        { success: false, error: 'Email and updates are required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Remove sensitive fields from updates
    const allowedUpdates = ['name', 'phone', 'profilePhoto', 'notifications', 'preferences', 'addresses', 'phoneVerified', 'phoneVerifiedAt', 'suburb', 'fullAddress'];
    const sanitizedUpdates = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const result = await usersCollection.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: {
          ...sanitizedUpdates,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
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
