import { randomBytes, randomInt } from 'crypto';

export function generateVerificationCode(): string {
  return randomInt(100000, 1000000).toString();
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}
