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

    // Generate client secret
    const clientSecret = appleSignin.getClientSecret({
      clientID: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
      teamID: process.env.APPLE_TEAM_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
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
    return NextResponse.json(
      { success: false, error: error.message || 'Apple Sign In failed' },
      { status: 500 }
    );
  }
}
