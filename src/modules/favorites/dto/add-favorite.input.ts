import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class AddFavoriteInput {
  @Field(() => ID)
  @IsString()
  productId: string;
}
