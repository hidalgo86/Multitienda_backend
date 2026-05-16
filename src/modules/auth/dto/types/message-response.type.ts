import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MessageResponseType {
  @Field(() => String)
  message: string;
}
