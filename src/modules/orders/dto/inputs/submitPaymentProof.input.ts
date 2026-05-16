import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

@InputType()
export class SubmitPaymentProofInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  paymentReceiptNumber!: string;

  @Field()
  @IsUrl({ require_protocol: true })
  paymentProofUrl!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  paymentProofPublicId!: string;
}
