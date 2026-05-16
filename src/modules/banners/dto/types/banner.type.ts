import {
  Field,
  GraphQLISODateTime,
  ID,
  Int,
  ObjectType,
} from '@nestjs/graphql';

@ObjectType('Banner')
export class BannerType {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  imageUrl!: string;

  @Field(() => String, { nullable: true })
  imagePublicId?: string | null;

  @Field()
  altText!: string;

  @Field()
  subtitle!: string;

  @Field(() => String, { nullable: true })
  linkUrl?: string | null;

  @Field()
  ctaLabel!: string;

  @Field(() => Int)
  order!: number;

  @Field()
  isActive!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startsAt?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endsAt?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
