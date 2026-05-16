import { UserModel } from '@/modules/users/model/user.model';

export interface AuthModel {
  user: UserModel;
  access_token: string;
  refresh_token: string;
}
