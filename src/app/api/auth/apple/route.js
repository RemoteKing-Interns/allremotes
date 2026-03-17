import { NextResponse } from 'next/server';
import appleSignin from 'apple-signin-auth';

export async function POST(request) {
  try {
    const { code, user } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APPLE_SERVICE_ID) {
      console.error('Missing NEXT_PUBLIC_APPLE_SERVICE_ID');
      return NextResponse.json(
        { success: false, error: 'Apple Service ID not configured' },
        { status: 500 }
      );
    }
    if (!process.env.APPLE_TEAM_ID) {
      console.error('Missing APPLE_TEAM_ID');
      return NextResponse.json(
        { success: false, error: 'Apple Team ID not configured' },
        { status: 500 }
      );
    }
    if (!process.env.APPLE_KEY_ID) {
      console.error('Missing APPLE_KEY_ID');
      return NextResponse.json(
        { success: false, error: 'Apple Key ID not configured' },
        { status: 500 }
      );
    }
    if (!process.env.APPLE_PRIVATE_KEY) {
      console.error('Missing APPLE_PRIVATE_KEY');
      return NextResponse.json(
        { success: false, error: 'Apple Private Key not configured' },
        { status: 500 }
      );
    }

    // Generate client secret
    // Ensure private key has proper newlines (Vercel may escape them)
    const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const clientSecret = appleSignin.getClientSecret({
      clientID: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
      teamID: process.env.APPLE_TEAM_ID,
      privateKey: privateKey,
      keyIdentifier: process.env.APPLE_KEY_ID,
    });

    // Exchange authorization code for tokens
    const tokens = await appleSignin.getAuthorizationToken(code, {
      clientID: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
      redirectUri: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      clientSecret,
    });

    // Verify and decode the ID token
    const { sub, email } = await appleSignin.verifyIdToken(tokens.id_token, {
      audience: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
      ignoreExpiration: false,
    });

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: sub,
        email: email,
        name: user?.name ? `${user.name.firstName} ${user.name.lastName}` : 'Apple User',
        provider: 'apple',
      },
    });
  } catch (error) {
    console.error('Apple Sign In error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Apple Sign In failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
