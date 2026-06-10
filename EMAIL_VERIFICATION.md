# Email Verification System

All Remotes implements a complete email verification system to ensure user accounts are valid and secure.

## Overview

When users register with email/password, they must verify their email address before they can log in. This prevents:
- Fake/spam accounts
- Typos in email addresses
- Unauthorized access

## Flow

```
1. User registers with email/password
2. System generates verification token (hashed)
3. Verification email sent with link
4. User clicks link in email
5. Email verified → Account activated
6. User can now log in
```

## API Endpoints

### POST /api/auth/register
Creates a new user and sends verification email.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyStr0ng!Pass"
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "message": "Registration successful. Please check your email to verify your account.",
  "verificationRequired": true
}
```

### POST /api/auth/verify-email
Verifies email with token from the link.

**Request:**
```json
{
  "token": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "email": "john@example.com"
}
```

### PUT /api/auth/verify-email
Resends verification email.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### POST /api/auth/login
Login endpoint checks if email is verified.

**Error Response (unverified email):**
```json
{
  "success": false,
  "error": "Please verify your email before logging in. Check your inbox for the verification link.",
  "emailNotVerified": true,
  "email": "john@example.com"
}
```

## Security Features

1. **Hashed Tokens**: Verification tokens are SHA-256 hashed before storage
2. **Token Expiry**: Tokens expire after 24 hours
3. **One-time Use**: Tokens are deleted after successful verification
4. **Secure Generation**: Uses `crypto.randomBytes(32)` for token generation

## User Experience

### Registration Page
- Shows success message after registration
- Instructs user to check email
- Provides link to resend verification email
- Link to go to login page

### Verification Page (`/verify-email?token=...`)
- Shows loading state while verifying
- Displays success message with green checkmark
- Auto-redirects to login after 3 seconds
- Shows error if token invalid/expired
- Provides form to resend verification email

### Login Page
- Blocks login for unverified accounts
- Shows error message with resend option
- "Resend verification email" button

## Email Template

The verification email includes:
- Personalized greeting with user's name
- Clear call-to-action button
- Copy-paste link option
- 24-hour expiry warning
- Security note for accidental registrations

## Database Schema

Users collection includes verification fields:

```javascript
{
  email: "john@example.com",
  emailVerified: false,           // true after verification
  verificationToken: "hashed...",  // stored hashed
  verificationTokenExpiry: "2024-01-15T10:00:00Z"
}
```

## Configuration

Token expiry is configurable in the API:
```typescript
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
```

## Testing

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!@#"}'
```

### Test Verification
1. Check email for verification link
2. Extract token from link
3. Or visit `/verify-email?token=YOUR_TOKEN`

### Test Resend
```bash
curl -X PUT http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Troubleshooting

### "Invalid or expired verification token"
- Token was already used
- Token expired (24 hours)
- Wrong token provided

### "Email is already verified"
- User already clicked the link
- Account is active

### "User not found"
- Email address doesn't exist in database
- User registered with OAuth (Google/Apple)

### Not receiving verification email
- Check spam/junk folder
- Verify SMTP configuration in `.env.local`
- Check email service logs
- Try resending from login page

## Differences from OAuth

| Feature | Email/Password | Google/Apple OAuth |
|---------|---------------|-------------------|
| Verification Required | ✅ Yes | ❌ No (pre-verified) |
| Token Expiry | 24 hours | N/A |
| Resend Option | ✅ Yes | N/A |
| Verification Email | ✅ Sent | ❌ Not sent |

## Future Enhancements

- [ ] Rate limiting on verification attempts
- [ ] SMS verification option
- [ ] Magic link login (passwordless)
- [ ] Change email address with re-verification
- [ ] Admin manual verification for support cases

## Related Files

- `src/app/api/auth/register/route.ts` - Registration with verification
- `src/app/api/auth/login/route.ts` - Login with verification check
- `src/app/api/auth/verify-email/route.ts` - Verify and resend endpoints
- `src/app/(site)/verify-email/page.tsx` - Verification page UI
- `src/app/(site)/register/page.tsx` - Registration with success state
- `src/app/(site)/login/page.tsx` - Login with resend option
- `src/lib/email.ts` - Verification email template
- `src/context/AuthContext.js` - Auth state with verification handling

## Security Notes

1. Tokens are single-use only
2. Tokens are hashed before storage (SHA-256)
3. Raw tokens only exist in emails
4. No sensitive data in verification URLs
5. HTTPS required in production

## Support

If users report issues with email verification:
1. Check email service configuration
2. Verify MongoDB connection
3. Check server logs for errors
4. Consider manual verification for edge cases
