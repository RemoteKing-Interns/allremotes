import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongo';

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
      });
    }

    // Create new user
    const newUser = {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await usersCollection.insertOne(newUser);
    
    return NextResponse.json({
      success: true,
      user: { ...newUser, _id: result.insertedId },
      isNew: true
    });

  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const provider = searchParams.get('provider');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    const query = { email };
    if (provider) {
      query.provider = provider;
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
