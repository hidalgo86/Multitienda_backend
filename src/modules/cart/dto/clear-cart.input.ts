import { IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ClearCartInput {
  @Field()
  @IsString()
  userId: string;
}
