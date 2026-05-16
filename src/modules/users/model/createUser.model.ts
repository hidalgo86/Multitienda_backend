export interface CreateUserModel {
  email: string;
  username: string;
  usernameNormalized?: string;
  password: string;
  verificationCodeHash?: string | null;
  verificationCodeExpiresAt?: Date | null;
  lastVerificationSentAt?: Date | null;
  refreshTokenHash?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetTokenExpiresAt?: Date | null;
}
