import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateBannerInput {
  @Field()
  @IsString()
  @MaxLength(120)
  title!: string;

  @Field()
  @IsUrl()
  imageUrl!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imagePublicId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  altText?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  subtitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  ctaLabel?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  startsAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  endsAt?: Date;
}
