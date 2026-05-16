import { UserRole, UserStatus } from '../schemas/users.schema';

export interface AuthUserModel {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationCodeHash?: string | null;
  verificationCodeExpiresAt?: Date | null;
  lastVerificationSentAt?: Date | null;
  refreshTokenHash?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetTokenExpiresAt?: Date | null;
  accountDeletionCodeHash?: string | null;
  accountDeletionCodeExpiresAt?: Date | null;
  lastAccountDeletionSentAt?: Date | null;
  failedLoginAttempts: number;
  lastFailedLoginAt?: Date | null;
  status: UserStatus;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
