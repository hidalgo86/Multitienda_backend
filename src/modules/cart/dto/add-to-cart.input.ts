import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsInt, Min, IsOptional, IsNotEmpty } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field(() => ID)
  @IsString()
  productId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  variantName?: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  quantity: number;
}
