// src/modules/products/dto/inputs/updateProduct.input.ts
import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { Genre, ProductState } from '../../schemas/products.schema';

import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUrl,
  IsNumber,
  IsInt,
  Min,
  ValidateNested,
  IsArray,
  IsMongoId,
  ArrayUnique,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

@ValidatorConstraint({ name: 'noStockPriceWithVariants', async: false })
class NoStockPriceWithVariantsConstraint
  implements ValidatorConstraintInterface
{
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as UpdateProductInput;
    if (!Array.isArray(obj.variants) || obj.variants.length === 0) {
      return true;
    }
    return obj.stock === undefined && obj.price === undefined;
  }

  defaultMessage(): string {
    return 'No puedes enviar variants junto con stock o price';
  }
}

// ==============================
// VARIANT UPDATE
// ==============================
@InputType({ description: 'Variante de producto (nombre + stock + price)' })
export class ProductVariantUpdateInput {
  @Field()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'name no puede estar vacío' })
  name!: string;

  @Field(() => Int)
  @IsInt({ message: 'El stock de variante debe ser un entero' })
  @Min(0)
  stock!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'image de variante debe ser una URL válida' })
  image?: string;
}

// ==============================
// IMAGE UPDATE
// ==============================
@InputType()
export class ProductImageUpdateInput {
  @Field()
  @IsUrl({}, { message: 'url de imagen debe ser una URL válida' })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  publicId!: string;
}

// ==============================
// UPDATE PRODUCT
// ==============================
/**
 * ⚠️ IMPORTANTE:
 * El SKU es INMUTABLE y NO se puede actualizar.
 * Se genera automáticamente al crear el producto y permanece igual para siempre.
 * Usar el SKU para hacer reclamaciones y reportes.
 *
 * CAMPOS ACTUALIZABLES:
 * - name, description, categoryId, genre
 * - variants (genéricas), stock y price (producto simple)
 * - images
 * - state (para marcar como activo o eliminado)
 *
 * NO ACTUALIZABLES:
 * - sku (único e inmutable)
 * - availability (se calcula automáticamente basado en stock)
 */
@InputType({ description: 'Entrada para actualizar un producto (parcial)' })
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'name no puede estar vacío' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId({ message: 'categoryId debe ser un ObjectId válido' })
  categoryId?: string;

  @Field(() => Genre, { nullable: true })
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'thumbnail debe ser una URL válida' })
  thumbnail?: string;

  // variantes genéricas (talla, color, volumen, etc.)
  @Field(() => [ProductVariantUpdateInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique(
    (v: ProductVariantUpdateInput) =>
      String(v?.name ?? '')
        .trim()
        .toLowerCase(),
    {
      message: 'Los nombres de variantes no deben repetirse',
    },
  )
  @Validate(NoStockPriceWithVariantsConstraint)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantUpdateInput)
  variants?: ProductVariantUpdateInput[];

  // stock para producto simple (sin variantes)
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'stock debe ser un entero' })
  @Min(0)
  stock?: number;

  // precio para producto simple (sin variantes)
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  // galería de imágenes
  @Field(() => [ProductImageUpdateInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageUpdateInput)
  images?: ProductImageUpdateInput[];

  @Field(() => ProductState, { nullable: true })
  @IsOptional()
  @IsEnum(ProductState)
  state?: ProductState;
}
