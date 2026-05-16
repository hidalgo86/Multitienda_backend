import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsMongoId,
} from 'class-validator';

@InputType({ description: 'Entrada para crear una categoría' })
export class CreateCategoryInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener minúsculas, números y guiones',
  })
  slug!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId()
  parentId?: string;
}
