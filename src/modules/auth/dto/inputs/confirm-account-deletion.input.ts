import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length } from 'class-validator';

@InputType()
export class ConfirmAccountDeletionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
