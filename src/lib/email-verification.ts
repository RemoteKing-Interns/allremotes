import crypto from 'crypto';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenExpiry(): Date {
  return new Date(Date.now() + TOKEN_EXPIRY_MS);
}
