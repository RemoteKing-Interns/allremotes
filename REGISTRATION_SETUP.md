# Registration Process Setup

This document describes the registration and authentication system for All Remotes.

## Overview

The registration system supports three methods:
1. **Email/Password** - Traditional registration with bcrypt hashing
2. **Google OAuth** - One-click Google sign-in
3. **Apple OAuth** - Apple Sign In for iOS/macOS users

**Tech Stack:**
- **MongoDB** for user data storage
- **bcryptjs** for password hashing
- **Email integration** for welcome emails (all methods)
- **localStorage fallback** for offline/development mode
- **Strict Password Policy** - Enforces strong passwords with validation

See `OAUTH_INTEGRATION.md` for detailed OAuth setup.
See `PASSWORD_POLICY.md` for password requirements and security guidelines.

## API Endpoints

### POST /api/auth/register
Register a new user with email and password.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyStr0ng!Pass"
}
```

**Note:** Password must meet strict security requirements (min 8 chars, uppercase, lowercase, number, special char). See `PASSWORD_POLICY.md`.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "provider": "email",
    "role": "customer",
    "createdAt": "...",
    "notifications": {...}
  },
  "message": "Registration successful"
}
```

**Validation:**
- Name, email, and password are required
- Email must be valid format
- Password must be at least 6 characters
- Email must not already be registered

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "provider": "email",
    "role": "customer"
  },
  "message": "Login successful"
}
```

## Features

### 1. Multiple Registration Methods
- **Email/Password**: Traditional registration with form validation
- **Google OAuth**: One-click sign-in with Google account
- **Apple OAuth**: Sign in with Apple ID (iOS/macOS/Safari)

### 2. Password Hashing
Passwords are hashed using bcrypt with a salt round of 10 before storing in MongoDB. OAuth users don't have passwords stored.

### 3. Welcome Emails (All Methods)
A welcome email is sent automatically after successful registration:
- Email/Password: Sent via `/api/auth/register`
- Google OAuth: Sent via `/api/users` when new user created
- Apple OAuth: Sent via `/api/users` when new user created

### 4. Input Validation
- Email format validation
- Minimum password length (6 characters)
- Duplicate email prevention (per provider)
- Required field checks

### 5. Fallback Mode
If the MongoDB API is unavailable (server error), the system falls back to localStorage:
- Stores user in localStorage
- Allows offline development/testing
- Note: Passwords in localStorage are NOT hashed (for dev only)
- OAuth users can still register/login in fallback mode

## User Schema

```javascript
{
  name: String,
  email: String (lowercase),
  password: String (hashed),
  provider: 'email' | 'google' | 'apple',
  role: 'customer' | 'admin',
  createdAt: Date,
  updatedAt: Date,
  emailVerified: Boolean,
  notifications: {
    email: {
      orderUpdates: Boolean,
      shippingUpdates: Boolean,
      promotions: Boolean,
      newsletters: Boolean,
      reviews: Boolean
    }
  }
}
```

## Client-Side Usage

### Registration
```javascript
import { useAuth } from '@/context/AuthContext';

const { register } = useAuth();

const handleRegister = async () => {
  const result = await register(name, email, password);
  if (result.success) {
    // User registered and logged in
  } else {
    // Show error: result.error
  }
};
```

### Login
```javascript
import { useAuth } from '@/context/AuthContext';

const { login } = useAuth();

const handleLogin = async () => {
  const result = await login(email, password);
  if (result.success) {
    // User logged in
  } else {
    // Show error: result.error
  }
};
```

### Admin Login
Hardcoded admin credentials (for development):
- Email: `admin@allremotes.com`
- Password: `Admin123!`

## Security Notes

1. **Password Hashing**: All passwords stored in MongoDB are hashed with bcrypt
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting to auth endpoints
4. **Session Management**: Currently uses localStorage for session persistence
5. **Email Verification**: Not implemented yet (emailVerified field is always false)

## Future Enhancements

- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Session management with JWT or cookies
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication (2FA)

## Testing

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### "Registration failed" error
- Check MongoDB connection
- Verify email service configuration (for welcome emails)
- Check server logs for detailed error

### "Invalid email or password" error
- Verify email is correct (case-insensitive)
- Check if password was entered correctly
- For localStorage fallback users, note that API and localStorage are separate

### Welcome email not received
- Check email service configuration in `.env.local`
- Verify SMTP settings
- Check spam/junk folder
- Review server logs for email sending errors
