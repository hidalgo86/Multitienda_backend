import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { BusinessExtraFieldInput } from './business-extra-field.input';
import { BusinessColorPaletteInput } from './business-color-palette.input';

@InputType()
export class UpdateBusinessSettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => String(value ?? '').trim().length > 0)
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  logoPublicId?: string;

  @Field(() => [BusinessExtraFieldInput], { nullable: true })
  @IsOptional()
  extraFields?: BusinessExtraFieldInput[];

  @Field(() => BusinessColorPaletteInput, { nullable: true })
  @IsOptional()
  colorPalette?: BusinessColorPaletteInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  paymentsEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  checkoutDisabledMessage?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  storePickupAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  pickupMessage?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryDisabledMessage?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  manualPaymentInstructions?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  seoDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagramUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  aboutTitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  aboutText?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  aboutImageUrl?: string;
}
