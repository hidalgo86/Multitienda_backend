import { Field, InputType } from '@nestjs/graphql';
import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class BusinessColorPaletteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  preset?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand50?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand100?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand200?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand300?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand400?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand500?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand600?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand700?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand800?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand900?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  brand950?: string;
}
