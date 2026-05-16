import { Field, ObjectType } from '@nestjs/graphql';
import { UserType } from '@/modules/users/dto/types/user.types';

@ObjectType()
export class AuthType {
  @Field(() => UserType)
  user: UserType;

  @Field(() => String)
  access_token: string;

  @Field(() => String)
  refresh_token: string;
}
