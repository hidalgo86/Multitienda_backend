import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { ProductType } from '@/modules/products/dto/types/product.type';
import { UserType } from '@/modules/users/dto/types/user.types';

@ObjectType()
export class FavoriteModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => [ID])
  productIds: string[];

  @Field(() => [ProductType])
  products: ProductType[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
