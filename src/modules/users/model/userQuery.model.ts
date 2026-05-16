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
    this.filters = input?.filters ?? {};
    this.pagination = input?.pagination ?? {
      page: 1,
      limit: Number(process.env.DEFAULT_PAGE_LIMIT) || 20,
    };
  }
}
