import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';

export enum DeliveryMethod {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export enum CheckoutPaymentMethod {
  TRANSFER = 'transfer',
  CASH = 'cash',
}

registerEnumType(DeliveryMethod, { name: 'DeliveryMethod' });
registerEnumType(CheckoutPaymentMethod, { name: 'CheckoutPaymentMethod' });

@InputType()
export class CheckoutInput {
  @Field(() => DeliveryMethod)
  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @Field(() => CheckoutPaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(CheckoutPaymentMethod)
  paymentMethod?: CheckoutPaymentMethod;
}
