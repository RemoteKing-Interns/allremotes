# Strict Password Policy

All Remotes implements a strict password policy to ensure user account security.

## Password Requirements

Passwords must meet the following criteria:

| Requirement | Description |
|------------|-------------|
| **Length** | Minimum 8 characters, maximum 128 characters |
| **Uppercase** | At least one uppercase letter (A-Z) |
| **Lowercase** | At least one lowercase letter (a-z) |
| **Numbers** | At least one digit (0-9) |
| **Special Characters** | At least one special character (!@#$%^&*()_+-=[]{}\|'":;.,<>) |
| **Unique Characters** | At least 4 unique characters |
| **No Common Passwords** | Cannot be from the list of 100+ common weak passwords |
| **No Username** | Cannot contain the user's name |
| **No Email** | Cannot contain the user's email address |
| **No Repeating** | Cannot have the same character 3+ times in a row |

## Examples of Rejected Passwords

These passwords will be **rejected**:

```
password          (too common)
Password123       (no special character)
Password123!      (contains "password")
qwerty123!       (too common)
Admin123!         (too common)
11111111!         (repeating characters)
aaaaaaaa1!        (repeating characters)
JohnDoe2024!      (contains username)
user@email2024!   (contains email)
```

## Examples of Valid Passwords

These passwords will be **accepted**:

```
MySecure$Pass9
R3mote$King@2024
All_R3motes!42
Secure#Passw0rd
C0mplex!Pass9
```

## Password Strength Levels

The password strength is calculated on a scale of 0-100:

| Score | Strength | Color |
|-------|----------|-------|
| 0-39 | Weak | 🔴 Red |
| 40-59 | Fair | 🟠 Orange |
| 60-79 | Good | 🟡 Yellow |
| 80-100 | Strong | 🟢 Green |

## Implementation

### Server-Side (API)

**Registration API** (`POST /api/auth/register`):
- Validates password before creating account
- Returns detailed error messages for each failed requirement
- Stores password with bcrypt hashing (salt rounds: 10)

**Change Password API** (`POST /api/auth/change-password`):
- Requires current password verification
- Validates new password against the same policy
- Prevents reusing the same password

### Client-Side (UI)

**Registration Page** (`/register`):
- Real-time password strength indicator
- Expandable password requirements list
- Shows specific validation errors
- Visual progress bar with color coding

### Code Example

```typescript
import { validatePassword } from '@/lib/password-policy';

// Validate a password
const result = validatePassword('MyP@ssw0rd', 'John Doe', 'john@email.com');

console.log(result.valid);      // true or false
console.log(result.strength);   // 'weak', 'fair', 'good', or 'strong'
console.log(result.score);      // 0-100
console.log(result.errors);     // Array of error messages
```

## Security Best Practices

1. **Never store plain text passwords** - All passwords are hashed with bcrypt
2. **Enforce on both client and server** - Client for UX, server for security
3. **Reject common passwords** - Prevents brute force attacks
4. **Require complexity** - Mixed case, numbers, and special characters
5. **Check against personal info** - Prevents passwords derived from user data

## API Responses

### Failed Validation Response

```json
{
  "success": false,
  "error": "Password does not meet security requirements",
  "passwordErrors": [
    "Password must contain at least one uppercase letter (A-Z)",
    "Password must contain at least one special character"
  ],
  "passwordRequirements": {
    "valid": false,
    "errors": [...],
    "strength": "weak",
    "score": 25
  }
}
```

### Successful Registration

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
  "message": "Registration successful"
}
```

## Configuration

The password policy is configurable in `src/lib/password-policy.ts`:

```typescript
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUniqueChars: 4,
  preventCommonPasswords: true,
  preventUsernameInPassword: true,
  preventEmailInPassword: true,
  preventRepeatingChars: true,
  maxRepeatingChars: 3,
};
```

## Common Passwords List

The system rejects these and 100+ other common passwords:

- password, password123
- 123456, 12345678, 1234567890
- qwerty, qwerty123
- admin, admin123
- letmein, welcome, welcome123
- monkey, abc123
- football, baseball, dragon
- master, shadow, sunshine
- princess, iloveyou
- trustno1, 000000, 111111

## Troubleshooting

### "Password is too common"
- Choose a more unique password
- Avoid dictionary words
- Mix multiple unrelated words with numbers and symbols

### "Password must contain special character"
- Use: ! @ # $ % ^ & * ( ) _ + - = [ ] { } | \ ' " : ; . , < >
- At least one required

### "Password cannot contain your username/email"
- Remove any part of your name or email
- Use completely unrelated words

## Future Enhancements

- [ ] Password expiration policy
- [ ] Password history (prevent reuse of last N passwords)
- [ ] Have I Been Pwned API integration
- [ ] Adaptive MFA based on password strength
- [ ] Passwordless authentication (WebAuthn/FIDO2)

## Related Files

- `src/lib/password-policy.ts` - Policy configuration and validation
- `src/app/api/auth/register/route.ts` - Registration API
- `src/app/api/auth/change-password/route.ts` - Change password API
- `src/app/(site)/register/page.tsx` - Registration UI
- `src/context/AuthContext.js` - Auth state management

## References

- [OWASP Password Security Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [NCSC Password Guidance](https://www.ncsc.gov.uk/collection/passwords)
