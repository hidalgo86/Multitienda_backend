// src/modules/products/dto/inputs/createProduct.input.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  IsDefined,
  IsInt,
  Min,
  IsNumber,
  ValidateNested,
  IsMongoId,
  IsUrl,
  ArrayNotEmpty,
  IsEnum,
  ArrayUnique,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Genre } from '../../schemas/products.schema';
import { InputType, Field } from '@nestjs/graphql';

// DTO para variante genérica de producto
@InputType({ description: 'Variante de producto (nombre + stock + price)' })
export class ProductVariantInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'name no puede estar vacío' })
  name!: string;

  @Field()
  @IsInt({ message: 'El stock debe ser un entero' })
  @Min(0, { message: 'El stock debe ser un entero no negativo' })
  stock!: number;

  @Field()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe tener hasta 2 decimales' },
  )
  @Min(0, { message: 'El precio debe ser mayor o igual a cero' })
  price!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'La imagen de variante debe ser una URL válida' })
  image?: string;
}

// DTO para imágenes
@InputType({ description: 'Imagen del producto (url + publicId)' })
export class ProductImageInput {
  @Field()
  @IsUrl({}, { message: 'La url de imagen debe ser una URL válida' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  publicId!: string;
}

// DTO principal para crear productos
@InputType()
export class CreateProductInput {
  @Field()
  @IsMongoId({ message: 'categoryId debe ser un ObjectId válido' })
  @IsNotEmpty()
  categoryId!: string;

  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'name no puede estar vacío' })
  name!: string;

  // OPCIONALES
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  brand?: string;

  @Field({ nullable: true })
  @IsUrl({}, { message: 'thumbnail debe ser una URL válida' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  // Varias imágenes
  @Field(() => [ProductImageInput], { nullable: true })
  @IsOptional()
  @ArrayNotEmpty({ message: 'images no puede ser un arreglo vacío' })
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  images?: ProductImageInput[];

  // Campo opcional para rubros donde aplique
  @Field(() => Genre, { nullable: true })
  @IsOptional()
  @IsEnum(Genre, { message: 'genre debe ser un valor válido' })
  genre?: Genre;

  @Field(() => [ProductVariantInput], { nullable: true })
  @IsOptional()
  @ArrayNotEmpty({ message: 'variants no puede ser un arreglo vacío' })
  @ArrayUnique(
    (v: ProductVariantInput) =>
      String(v?.name ?? '')
        .trim()
        .toLowerCase(),
    {
      message: 'Los nombres de variantes no deben repetirse',
    },
  )
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInput)
  variants?: ProductVariantInput[];

  // Producto simple sin variantes
  @Field({ nullable: true })
  @ValidateIf((o: CreateProductInput) => !o.variants || o.variants.length === 0)
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @Field({ nullable: true })
  @ValidateIf((o: CreateProductInput) => !o.variants || o.variants.length === 0)
  @IsDefined({ message: 'price es requerido cuando no envías variants' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
}
