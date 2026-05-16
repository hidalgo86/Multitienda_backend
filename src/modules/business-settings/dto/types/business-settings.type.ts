import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

@ObjectType('BusinessExtraField')
export class BusinessExtraFieldType {
  @Field()
  label!: string;

  @Field()
  value!: string;
}

@ObjectType('BusinessColorPalette')
export class BusinessColorPaletteType {
  @Field()
  preset!: string;

  @Field()
  brand50!: string;

  @Field()
  brand100!: string;

  @Field()
  brand200!: string;

  @Field()
  brand300!: string;

  @Field()
  brand400!: string;

  @Field()
  brand500!: string;

  @Field()
  brand600!: string;

  @Field()
  brand700!: string;

  @Field()
  brand800!: string;

  @Field()
  brand900!: string;

  @Field()
  brand950!: string;
}

@ObjectType('BusinessSettings')
export class BusinessSettingsType {
  @Field({ nullable: true })
  id?: string;

  @Field()
  businessName!: string;

  @Field()
  legalName!: string;

  @Field()
  email!: string;

  @Field()
  phone!: string;

  @Field()
  address!: string;

  @Field()
  city!: string;

  @Field()
  state!: string;

  @Field()
  country!: string;

  @Field()
  logoUrl!: string;

  @Field(() => String, { nullable: true })
  logoPublicId?: string | null;

  @Field(() => [BusinessExtraFieldType])
  extraFields!: BusinessExtraFieldType[];

  @Field(() => BusinessColorPaletteType)
  colorPalette!: BusinessColorPaletteType;

  @Field()
  paymentsEnabled!: boolean;

  @Field()
  checkoutDisabledMessage!: string;

  @Field()
  storePickupAddress!: string;

  @Field()
  pickupMessage!: string;

  @Field()
  deliveryEnabled!: boolean;

  @Field()
  deliveryDisabledMessage!: string;

  @Field(() => [String])
  manualPaymentInstructions!: string[];

  @Field()
  seoTitle!: string;

  @Field()
  seoDescription!: string;

  @Field()
  ogImageUrl!: string;

  @Field()
  instagramUrl!: string;

  @Field()
  aboutTitle!: string;

  @Field()
  aboutText!: string;

  @Field()
  aboutImageUrl!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
