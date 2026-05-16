import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';

@InputType()
export class BusinessExtraFieldInput {
  @Field()
  @IsString()
  @MaxLength(80)
  label!: string;

  @Field()
  @IsString()
  @MaxLength(240)
  value!: string;
}
