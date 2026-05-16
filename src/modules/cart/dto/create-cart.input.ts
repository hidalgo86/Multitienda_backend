import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateCartInput {
  @Field()
  @IsString()
  userId: string;
}
