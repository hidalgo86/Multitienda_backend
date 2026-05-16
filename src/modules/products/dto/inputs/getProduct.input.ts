// src/modules/products/dto/inputs/getProduct.input.ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  ProductState,
  ProductAvailability,
  Genre,
} from '../../schemas/products.schema';
import {
  IsOptional,
  ValidateNested,
  IsString,
  IsInt,
  Min,
  Max,
  IsNumber,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsEnum,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSortBy } from '../../models/productsQuery.model';

@ValidatorConstraint({ name: 'minLessThanMax', async: false })
export class MinLessThanMax implements ValidatorConstraintInterface {
  validate(maxPrice: number, args: ValidationArguments): boolean {
    const obj = args.object as ProductFilterInput;

    if (typeof obj.minPrice === 'number' && typeof maxPrice === 'number') {
      return obj.minPrice <= maxPrice;
    }

    return true;
  }

  defaultMessage(): string {
    return 'minPrice debe ser menor o igual a maxPrice';
  }
}

@InputType({ description: 'Parametros de paginacion' })
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page!: number;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede ser mayor a 100' })
  limit!: number;

  @Field(() => ProductSortBy, {
    nullable: true,
    defaultValue: ProductSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;
}

@InputType({ description: 'Filtros de busqueda de productos' })
export class ProductFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsMongoId({ message: 'categoryId debe ser un ObjectId valido' })
  categoryId?: string;

  @Field(() => Genre, { nullable: true })
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true, message: 'Cada variante debe ser un texto' })
  variantNames?: string[];

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'El precio minimo debe ser un numero' })
  @Min(0, { message: 'El precio minimo no puede ser negativo' })
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({}, { message: 'El precio maximo debe ser un numero' })
  @Min(0, { message: 'El precio maximo no puede ser negativo' })
  @ValidateIf((o: ProductFilterInput) => o.minPrice !== undefined)
  @Validate(MinLessThanMax, {
    message: 'El precio minimo no puede ser mayor que el maximo',
  })
  maxPrice?: number;

  @Field(() => ProductState, { nullable: true })
  @IsOptional()
  @IsEnum(ProductState)
  state?: ProductState;

  @Field(() => ProductAvailability, { nullable: true })
  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}

@InputType({ description: 'Entrada de consulta para listar productos' })
export class ProductsQueryInput {
  @Field(() => ProductFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductFilterInput)
  filters?: ProductFilterInput;

  @Field(() => PaginationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationInput)
  pagination?: PaginationInput;
}
