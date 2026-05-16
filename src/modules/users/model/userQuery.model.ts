import { UserRole, UserStatus } from '../schemas/users.schema';
import { PaginationInput } from '@/common/utils/pagination.util';

export class UserFiltersModel {
  username?: string;
  email?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
  status?: UserStatus;
}

export class UsersQueryModel {
  filters: UserFiltersModel;
  pagination: PaginationInput;

  constructor(input?: Partial<UsersQueryModel>) {
    this.filters = input?.filters ?? ({} as UserFiltersModel);
    this.pagination = input?.pagination ?? { page: 1, limit: 20 };
  }
}
