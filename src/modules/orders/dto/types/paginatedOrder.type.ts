import { Field, Int, ObjectType } from '@nestjs/graphql';
import { OrderModel } from '../../model/order.model';

@ObjectType()
export class PaginatedOrderType {
  @Field(() => [OrderModel])
  items!: OrderModel[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  totalPages!: number;
}
