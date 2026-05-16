import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  Matches,
  IsMongoId,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

@InputType({ description: 'Entrada para actualizar una categoría' })
export class UpdateCategoryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener minúsculas, números y guiones',
  })
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imagePublicId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
