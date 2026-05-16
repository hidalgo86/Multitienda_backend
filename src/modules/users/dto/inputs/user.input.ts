import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UserInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  userId: string;
}
