import {
  Field,
  Float,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { UserType } from '@/modules/users/dto/types/user.types';
import { DeliveryMethod } from '../dto/inputs/checkout.input';
import { OrderStatus, PaymentMethod } from '../schemas/orders.schema';

registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

@ObjectType()
export class OrderItemModel {
  @Field()
  productId: string;

  @Field({ nullable: true })
  variantName?: string;

  @Field(() => Int)
  quantity: number;

  @Field()
  productName: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  lineTotal: number;
}

@ObjectType()
export class ShippingAddressModel {
  @Field()
  address: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phone?: string;
}

@ObjectType()
export class OrderModel {
  @Field(() => ID)
  id: string;

  @Field()
  orderNumber: string;

  @Field()
  userId: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field(() => [OrderItemModel])
  items: OrderItemModel[];

  @Field(() => Float)
  totalAmount: number;

  @Field(() => ShippingAddressModel)
  shippingAddress: ShippingAddressModel;

  @Field(() => DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  paymentReference?: string;

  @Field({ nullable: true })
  paymentReceiptNumber?: string;

  @Field({ nullable: true })
  paymentProofUrl?: string;

  @Field({ nullable: true })
  paymentProofPublicId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  paymentProofSubmittedAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  paidAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  cancelledAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
