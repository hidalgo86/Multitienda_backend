import {
  GraphQLISODateTime,
  Field,
  Float,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';
import { ProductType } from '@/modules/products/dto/types/product.type';
import { UserType } from '@/modules/users/dto/types/user.types';

@ObjectType()
export class CartItemSnapshotModel {
  @Field()
  productName: string;

  @Field({ nullable: true })
  variantName?: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field(() => Float)
  unitPrice: number;
}

@ObjectType()
export class CartItemModel {
  @Field()
  productId: string;

  @Field({ nullable: true })
  variantName?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => CartItemSnapshotModel)
  snapshot: CartItemSnapshotModel;

  @Field(() => ProductType, { nullable: true })
  product?: ProductType | null;
}

@ObjectType()
export class CartModel {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => [CartItemModel])
  items: CartItemModel[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
