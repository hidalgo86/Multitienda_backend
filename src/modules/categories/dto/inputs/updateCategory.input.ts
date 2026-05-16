import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, Matches, IsMongoId } from 'class-validator';

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
}
