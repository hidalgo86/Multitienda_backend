import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../schemas/orders.schema';

@InputType()
export class OrdersFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orderId?: string;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;
}

@InputType()
export class OrdersPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page!: number;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}

@InputType()
export class OrdersQueryInput {
  @Field(() => OrdersFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrdersFilterInput)
  filters?: OrdersFilterInput;

  @Field(() => OrdersPaginationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrdersPaginationInput)
  pagination?: OrdersPaginationInput;
}
