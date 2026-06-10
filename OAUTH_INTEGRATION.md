# OAuth Integration Guide

All Remotes supports three registration/login methods:
1. **Email/Password** - Traditional registration
2. **Google OAuth** - One-click Google sign-in
3. **Apple OAuth** - Apple Sign In (iOS/macOS/Safari)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Email/Password │     │  Google OAuth   │     │   Apple OAuth   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ POST /api/auth/       │ POST /api/users       │ POST /api/auth/apple
         │   register            │                       │
         │ POST /api/auth/login  │                       │
         │                       │                       │
         └───────────┬───────────┴───────────┬───────────┘
                     │                       │
                     ▼                       ▼
            ┌─────────────────┐      ┌─────────────────┐
            │  MongoDB Users  │      │  Welcome Email  │
            │   Collection    │      │   (if new)      │
            └─────────────────┘      └─────────────────┘
```

## Registration Flows

### 1. Email/Password Registration

**File:** `src/app/(site)/register/page.tsx`

**Flow:**
1. User fills name, email, password, confirm password
2. Client validation (password match, min length)
3. `POST /api/auth/register`
4. Password hashed with bcrypt
5. User saved to MongoDB
6. Welcome email sent
7. Auto-login user

**API:** `POST /api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Google OAuth Registration

**File:** `src/app/(site)/register/page.tsx` & `src/app/(site)/login/page.tsx`

**Flow:**
1. User clicks "Continue with Google"
2. Google OAuth popup opens
3. User authenticates with Google
4. Google returns JWT token
5. Token decoded to get user info (name, email, picture)
6. `POST /api/users` with provider: 'google'
7. If new user: save to MongoDB, send welcome email
8. If existing: return user data
9. Auto-login user

**Required Environment Variables:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://allremotes.com.au` (production)
7. Copy the Client ID to your `.env.local`

### 3. Apple OAuth Registration

**File:** `src/app/(site)/register/page.tsx` & `src/app/(site)/login/page.tsx`

**Flow:**
1. User clicks "Sign in with Apple"
2. Apple Sign In popup opens
3. User authenticates with Apple ID
4. Apple returns authorization code
5. `POST /api/auth/apple` with code
6. Server exchanges code for tokens
7. Verify ID token, get user info
8. `POST /api/users` with provider: 'apple'
9. If new user: save to MongoDB, send welcome email
10. Auto-login user

**Required Environment Variables:**
```env
NEXT_PUBLIC_APPLE_SERVICE_ID=your-service-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

**Apple Developer Setup:**
1. Go to [Apple Developer](https://developer.apple.com/)
2. Go to "Certificates, Identifiers & Profiles"
3. Create an App ID with "Sign In with Apple" capability
4. Create a Service ID for your domain
5. Configure Sign In with Apple for the Service ID
6. Create a private key with "Sign In with Apple" enabled
7. Download the private key file
8. Extract the private key content and add to env

See `APPLE_SIGNIN_SETUP.md` for detailed setup instructions.

## API Endpoints

### POST /api/auth/register
Traditional email/password registration.

### POST /api/auth/login
Email/password login with bcrypt password verification.

### POST /api/users
Create or get OAuth user (Google/Apple).
- Checks if user exists by email + provider
- Creates new user if not exists
- Returns existing user if found

### POST /api/auth/apple
Handle Apple Sign In authorization code exchange.
- Validates Apple credentials
- Exchanges code for tokens
- Returns user data for `/api/users`

## User Schema (All Providers)

```javascript
{
  // Core fields
  name: String,
  email: String (lowercase),
  provider: 'email' | 'google' | 'apple',
  
  // Provider-specific
  password: String (hashed, email only),
  picture: String (OAuth only),
  
  // Common fields
  role: 'customer' | 'admin',
  createdAt: Date,
  updatedAt: Date,
  emailVerified: Boolean,
  
  // Notification preferences
  notifications: {
    email: {
      orderUpdates: true,
      shippingUpdates: true,
      promotions: false,
      newsletters: true,
      reviews: true
    }
  }
}
```

## AuthContext Methods

### register(name, email, password)
- Tries API registration first
- Falls back to localStorage if API fails
- Returns: `{ success: boolean, error?: string }`

### login(email, password)
- Checks hardcoded admin first
- Tries API login
- Falls back to localStorage
- Returns: `{ success: boolean, error?: string }`

### loginWithOAuth(provider, userData)
- Calls `/api/users` to save/get user
- Handles Google and Apple
- Also saves to localStorage as backup
- Returns: `{ success: boolean, error?: string }`

## Welcome Emails

All three registration methods trigger welcome emails:

| Method | Trigger | Template |
|--------|---------|----------|
| Email/Password | After successful API registration | `sendWelcomeEmail` |
| Google OAuth | After new user created in `/api/users` | `sendWelcomeEmail` |
| Apple OAuth | After new user created in `/api/users` | `sendWelcomeEmail` |

## Error Handling

### Email/Password
- 400: Missing fields, invalid email, weak password
- 409: Email already registered
- 500: Database or server error

### Google OAuth
- Missing credential error
- Decode error
- API save error (falls back to localStorage)

### Apple OAuth
- Missing code error
- Missing configuration (service ID, team ID, etc.)
- Token exchange error
- API save error (falls back to localStorage)

## Testing

### Email/Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Google OAuth (Manual Test)
1. Go to `/register` or `/login`
2. Click "Continue with Google"
3. Complete Google authentication
4. Check MongoDB for new user
5. Check email for welcome message

### Apple OAuth (Manual Test)
1. Go to `/register` or `/login` in Safari or on iOS
2. Click "Sign in with Apple"
3. Complete Apple authentication
4. Check MongoDB for new user
5. Check email for welcome message

## Security Considerations

1. **OAuth State**: Currently using popup-based flow (not redirect)
2. **Email Verification**: OAuth emails are pre-verified by providers
3. **Password Hashing**: Only email/password users have hashed passwords
4. **Token Storage**: User session stored in localStorage (consider JWT/cookies for production)
5. **Admin Login**: Hardcoded admin credentials (should be moved to database)

## Fallback Mode

All registration methods fall back to localStorage if the API is unavailable:
- Useful for development without MongoDB
- Allows offline testing
- Data syncs when API comes back online
- **Note:** Fallback mode does NOT send welcome emails

## Environment Variables Summary

```env
# Email/Password Registration
MONGODB_URI=your-mongodb-uri

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Apple OAuth
NEXT_PUBLIC_APPLE_SERVICE_ID=your-service-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key-content

# Email (for welcome emails)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=info@allremotes.com.au
SMTP_PASS=your-password
SMTP_FROM=noreply@allremotes.com.au
```

## Troubleshooting

### "Email already registered"
- User already exists with that email and provider
- Try logging in instead
- Check MongoDB to confirm

### "Google registration failed"
- Check NEXT_PUBLIC_GOOGLE_CLIENT_ID is set
- Verify domain is in authorized origins
- Check browser console for errors

### "Apple Sign In not available"
- Check all Apple environment variables
- Must use Safari or iOS for testing
- Check browser console for initialization errors

### Welcome email not received
- Check email service configuration
- Check server logs for email errors
- Verify SMTP credentials
- Check spam/junk folder
