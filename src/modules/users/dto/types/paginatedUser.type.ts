import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserType } from './user.types';

@ObjectType()
export class PaginatedUserType {
  @Field(() => [UserType])
  items!: UserType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  totalPages!: number;
}
