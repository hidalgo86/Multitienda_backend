import { UserStatus, UserRole } from '../schemas/users.schema';

export class UserModel {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  lastVerificationSentAt?: Date;
  isEmailVerified: boolean;
  status: UserStatus;
  name?: string;
  address?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
