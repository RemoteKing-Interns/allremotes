// Password Policy Configuration
// These can be adjusted based on security requirements

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number; // 0-100
}

// Password Policy Rules
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

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty',
  'qwerty123', 'admin', 'admin123', 'letmein', 'welcome',
  'welcome123', 'monkey', 'abc123', 'football', 'baseball',
  'dragon', 'master', 'shadow', 'sunshine', 'princess',
  'iloveyou', 'trustno1', '000000', '111111', '1234567890',
  'password1', 'login', 'hello123', 'freedom', 'whatever',
  'qazwsx', 'password!', 'passw0rd', 'p@ssw0rd', 'p@ssword',
  'welcome1', 'admin1', 'user123', 'test123', 'demo123',
  'allremotes', 'remotes', 'allremotes123', 'remote123',
];

/**
 * Validates a password against the strict policy
 */
export function validatePassword(
  password: string,
  username?: string,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  } else {
    score += 20;
  }

  // Check maximum length
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
  }

  // Check for uppercase letters
  const hasUppercase = /[A-Z]/.test(password);
  if (PASSWORD_POLICY.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (hasUppercase) {
    score += 15;
  }

  // Check for lowercase letters
  const hasLowercase = /[a-z]/.test(password);
  if (PASSWORD_POLICY.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (hasLowercase) {
    score += 15;
  }

  // Check for numbers
  const hasNumbers = /[0-9]/.test(password);
  if (PASSWORD_POLICY.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (hasNumbers) {
    score += 15;
  }

  // Check for special characters
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (PASSWORD_POLICY.requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|\'":;.,<>)');
  } else if (hasSpecialChars) {
    score += 15;
  }

  // Check for unique characters
  const uniqueChars = new Set(password).size;
  if (uniqueChars < PASSWORD_POLICY.minUniqueChars) {
    errors.push(`Password must contain at least ${PASSWORD_POLICY.minUniqueChars} unique characters`);
  } else {
    score += 10;
  }

  // Check for common passwords
  if (PASSWORD_POLICY.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('This password is too common and easily guessed. Please choose a more unique password.');
      score = 0;
    }
  }

  // Check if password contains username
  if (PASSWORD_POLICY.preventUsernameInPassword && username) {
    const lowerPassword = password.toLowerCase();
    const lowerUsername = username.toLowerCase();
    if (lowerPassword.includes(lowerUsername)) {
      errors.push('Password cannot contain your username');
    }
  }

  // Check if password contains email
  if (PASSWORD_POLICY.preventEmailInPassword && email) {
    const lowerPassword = password.toLowerCase();
    const emailLocalPart = email.split('@')[0].toLowerCase();
    if (lowerPassword.includes(emailLocalPart)) {
      errors.push('Password cannot contain your email address');
    }
  }

  // Check for repeating characters
  if (PASSWORD_POLICY.preventRepeatingChars) {
    const repeatingPattern = new RegExp(`(.)\\1{${PASSWORD_POLICY.maxRepeatingChars},}`);
    if (repeatingPattern.test(password)) {
      errors.push(`Password cannot contain the same character repeated ${PASSWORD_POLICY.maxRepeatingChars} or more times`);
    }
  }

  // Calculate strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (errors.length > 0 || score < 40) {
    strength = 'weak';
  } else if (score < 60) {
    strength = 'fair';
  } else if (score < 80) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Gets password requirements as a list for display
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_POLICY.minLength} characters long`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*()_+-=[]{}|\'":;.,<>)',
    `At least ${PASSWORD_POLICY.minUniqueChars} unique characters`,
    'Cannot be a common password',
    'Cannot contain your username or email',
    'Cannot have 3 or more repeating characters',
  ];
}

/**
 * Simple password validation for client-side use
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).valid;
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'weak':
      return '#ef4444'; // red-500
    case 'fair':
      return '#f97316'; // orange-500
    case 'good':
      return '#eab308'; // yellow-500
    case 'strong':
      return '#22c55e'; // green-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: string): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'strong':
      return 'Strong';
    default:
      return 'Unknown';
  }
}
