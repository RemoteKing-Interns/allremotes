# OAuth Integration Guide

This guide will help you integrate **Google OAuth** and **Apple Sign In** into your AllRemotes application.

---

## Table of Contents
1. [Google OAuth Integration](#google-oauth-integration)
2. [Apple Sign In Integration](#apple-sign-in-integration)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Implementation Steps](#implementation-steps)

---

## Google OAuth Integration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**

### Step 2: Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - App name: `AllRemotes`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

### Step 3: Create OAuth Client ID

1. Application type: **Web application**
2. Name: `AllRemotes Web Client`
3. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

### Step 4: Install Google OAuth Library

```bash
npm install @react-oauth/google
```

### Step 5: Update Login Page

Replace the mock Google login in `src/app/(site)/login/page.tsx`:

```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Wrap your component with GoogleOAuthProvider
export default function LoginWrapper() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <Login />
    </GoogleOAuthProvider>
  );
}

// Inside your Login component, replace handleGoogleLogin:
const handleGoogleLogin = async (credentialResponse) => {
  setError('');
  setLoading(true);
  
  try {
    // Decode the JWT token from Google
    const decoded = jwtDecode(credentialResponse.credential);
    
    const googleUser = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      provider: 'google',
      picture: decoded.picture
    };
    
    const result = loginWithOAuth('google', googleUser);
    
    if (result.success) {
      router.push("/");
    } else {
      setError('Failed to login with Google');
    }
  } catch (err) {
    setError('Failed to login with Google');
  }
  
  setLoading(false);
};

// Replace the Google button with:
<GoogleLogin
  onSuccess={handleGoogleLogin}
  onError={() => setError('Google login failed')}
  useOneTap
  theme="outline"
  size="large"
  text="continue_with"
  shape="rectangular"
/>
```

---

## Apple Sign In Integration

### Step 1: Create Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com/)
2. Enroll in the Apple Developer Program ($99/year)

### Step 2: Register App ID

1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** > **+** button
3. Select **App IDs** > **Continue**
4. Select **App** > **Continue**
5. Fill in:
   - Description: `AllRemotes`
   - Bundle ID: `com.allremotes.web` (explicit)
6. Enable **Sign in with Apple**
7. Click **Continue** > **Register**

### Step 3: Create Service ID

1. Click **Identifiers** > **+** button
2. Select **Services IDs** > **Continue**
3. Fill in:
   - Description: `AllRemotes Web`
   - Identifier: `com.allremotes.web.service`
4. Enable **Sign in with Apple**
5. Click **Configure**
6. Add domains and return URLs:
   - Domains: `localhost`, `yourdomain.com`
   - Return URLs: 
     - `http://localhost:3000/api/auth/callback/apple`
     - `https://yourdomain.com/api/auth/callback/apple`
7. Click **Save** > **Continue** > **Register**

### Step 4: Create Private Key

1. Go to **Keys** > **+** button
2. Key Name: `AllRemotes Sign In Key`
3. Enable **Sign in with Apple**
4. Click **Configure** > Select your App ID
5. Click **Save** > **Continue** > **Register**
6. **Download the key file** (you can only download once!)
7. Note the **Key ID**

### Step 5: Get Team ID

1. Go to **Membership** in Apple Developer
2. Copy your **Team ID**

### Step 6: Install Apple Sign In Library

```bash
npm install apple-signin-auth
```

### Step 7: Create API Route for Apple Sign In

Create `src/app/api/auth/apple/route.js`:

```javascript
import { NextResponse } from 'next/server';
import appleSignin from 'apple-signin-auth';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    const clientSecret = appleSignin.getClientSecret({
      clientID: process.env.APPLE_SERVICE_ID,
      teamID: process.env.APPLE_TEAM_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
      keyIdentifier: process.env.APPLE_KEY_ID,
    });

    const tokens = await appleSignin.getAuthorizationToken(code, {
      clientID: process.env.APPLE_SERVICE_ID,
      redirectUri: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
      clientSecret,
    });

    const { sub, email } = await appleSignin.verifyIdToken(tokens.id_token, {
      audience: process.env.APPLE_SERVICE_ID,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: sub,
        email: email,
        provider: 'apple'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

### Step 8: Update Login Page for Apple

Replace the mock Apple login in `src/app/(site)/login/page.tsx`:

```javascript
const handleAppleLogin = async () => {
  setError('');
  setLoading(true);
  
  try {
    // Initialize Apple Sign In
    if (typeof window !== 'undefined' && window.AppleID) {
      const data = await window.AppleID.auth.signIn();
      
      // Send authorization code to your backend
      const response = await fetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.authorization.code })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const appleUser = {
          id: result.user.id,
          name: data.user?.name ? `${data.user.name.firstName} ${data.user.name.lastName}` : 'Apple User',
          email: result.user.email,
          provider: 'apple',
          picture: null
        };
        
        const loginResult = loginWithOAuth('apple', appleUser);
        
        if (loginResult.success) {
          router.push("/");
        } else {
          setError('Failed to login with Apple');
        }
      }
    }
  } catch (err) {
    setError('Failed to login with Apple');
  }
  
  setLoading(false);
};

// Add Apple Sign In script to your layout or page
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
  script.async = true;
  document.body.appendChild(script);
  
  script.onload = () => {
    window.AppleID.auth.init({
      clientId: process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
      scope: 'name email',
      redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
      usePopup: true
    });
  };
  
  return () => {
    document.body.removeChild(script);
  };
}, []);
```

---

## Environment Variables Setup

Create or update `.env.local` file:

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple Sign In
NEXT_PUBLIC_APPLE_SERVICE_ID=com.allremotes.web.service
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----"
NEXT_PUBLIC_APPLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/apple
```

**Important:** Never commit `.env.local` to version control. Add it to `.gitignore`.

---

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @react-oauth/google apple-signin-auth jwt-decode
```

### 2. Update Environment Variables

Add all the credentials from Google Cloud Console and Apple Developer to `.env.local`

### 3. Update Login Page

Replace the mock OAuth handlers with the real implementations shown above.

### 4. Update Register Page

Apply the same changes to `src/app/(site)/register/page.tsx`

### 5. Test in Development

1. Start your dev server: `npm run dev`
2. Navigate to `/login`
3. Click "Continue with Google" - should open Google OAuth popup
4. Click "Continue with Apple" (on Apple devices) - should open Apple Sign In

### 6. Production Deployment

1. Update authorized domains in Google Cloud Console
2. Update return URLs in Apple Developer
3. Update environment variables in your hosting platform (Vercel, Netlify, etc.)
4. Deploy your application

---

## Security Best Practices

1. **Never expose client secrets** in client-side code
2. **Use HTTPS** in production
3. **Validate tokens** on the server side
4. **Store sensitive data** (private keys) as environment variables
5. **Implement CSRF protection** for OAuth flows
6. **Use short-lived tokens** and refresh tokens when possible
7. **Sanitize user input** from OAuth providers

---

## Troubleshooting

### Google OAuth Issues

- **"redirect_uri_mismatch"**: Check authorized redirect URIs in Google Cloud Console
- **"invalid_client"**: Verify client ID and secret
- **CORS errors**: Add your domain to authorized JavaScript origins

### Apple Sign In Issues

- **"invalid_client"**: Check Service ID and Team ID
- **"invalid_grant"**: Verify redirect URI matches exactly
- **Private key errors**: Ensure the key is properly formatted with newlines

---

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [NextAuth.js](https://next-auth.js.org/) - Alternative OAuth library for Next.js
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)

---

## Alternative: Using NextAuth.js

For a more comprehensive solution, consider using **NextAuth.js** which handles OAuth providers, sessions, and database integration:

```bash
npm install next-auth
```

This provides built-in support for Google, Apple, and 50+ other providers with minimal configuration.

See: https://next-auth.js.org/getting-started/example
