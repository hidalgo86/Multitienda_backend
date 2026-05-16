import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserRegisterType {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  isEmailVerified: boolean;

  @Field()
  status: string;

  @Field()
  role: string;
}
