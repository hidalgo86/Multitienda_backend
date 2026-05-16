import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  oldPassword: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
