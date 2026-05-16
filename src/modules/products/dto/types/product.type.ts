import {
  ObjectType,
  Field,
  Float,
  Int,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import {
  ProductState,
  ProductAvailability,
  Genre,
} from '../../schemas/products.schema';

// Estadísticas del producto (Analytics)
@ObjectType({ description: 'Estadísticas de engagement y ventas' })
export class ProductStatsType {
  @Field(() => Int, { description: 'Total de visitas al detalle' })
  views!: number;

  @Field(() => Int, { description: 'Total de veces agregado a favoritos' })
  favorites!: number;

  @Field(() => Int, { description: 'Total de veces agregado al carrito' })
  cartAdds!: number;

  @Field(() => Int, { description: 'Cantidad total vendida' })
  purchases!: number;

  @Field(() => Int, { description: 'Veces que apareció en búsquedas' })
  searches!: number;
}

// Variante genérica de producto
@ObjectType({ description: 'Variante de producto (nombre, stock y precio)' })
export class VariantType {
  @Field({ description: 'Nombre de la variante (XL, 100ml, rojo, etc.)' })
  name!: string;

  @Field(() => Int, { description: 'Stock disponible para esta variante' })
  stock!: number;

  @Field(() => Float, { description: 'Precio de esta variante' })
  price!: number;

  @Field({ nullable: true, description: 'Imagen opcional de la variante' })
  image?: string;
}

// Imagen del producto
@ObjectType({ description: 'Imagen del producto' })
export class ProductImageType {
  @Field({ description: 'URL de la imagen' })
  url!: string;

  @Field({ description: 'ID publico de la imagen en el proveedor externo' })
  publicId!: string;
}

// Producto completo
@ObjectType({ description: 'Entidad del producto para consultas GraphQL' })
export class ProductType {
  @Field(() => ID, { description: 'ID del producto' })
  id!: string;

  @Field({ description: 'Código único del producto (ej: ROP-8F3K2A)' })
  sku!: string;

  @Field({ description: 'Slug amigable para URL (ej: body-algodon-bebe)' })
  slug!: string;

  @Field(() => ID, { description: 'ID de la categoría' })
  categoryId!: string;

  @Field({ description: 'Nombre del producto' })
  name!: string;

  @Field(() => Genre, {
    nullable: true,
    description: 'Género del producto cuando aplique',
  })
  genre?: Genre;

  @Field(() => [VariantType], {
    nullable: true,
    description: 'Variantes del producto (talla, color, volumen, etc.)',
  })
  variants?: VariantType[];

  @Field(() => Int, {
    nullable: true,
    description: 'Stock disponible para producto simple sin variantes',
  })
  stock?: number;

  @Field(() => Float, {
    nullable: true,
    description: 'Precio para producto simple sin variantes',
  })
  price?: number;

  //////////////////////// campos opcionales generales /////////////////////////
  @Field({ nullable: true, description: 'Descripción del producto' })
  description?: string;

  @Field({ nullable: true, description: 'Marca del producto' })
  brand?: string;

  @Field({ nullable: true, description: 'Imagen principal del producto' })
  thumbnail?: string;

  // Galería de imágenes
  @Field(() => [ProductImageType], {
    nullable: true,
    description: 'Galería de imágenes del producto',
  })
  images?: ProductImageType[];

  @Field(() => ProductState, {
    nullable: false,
    description: 'Estado del producto (activo/eliminado)',
  })
  state!: ProductState;

  @Field(() => ProductAvailability, {
    nullable: false,
    description: 'Disponibilidad del producto (disponible/agotado)',
  })
  availability!: ProductAvailability;

  @Field(() => ProductStatsType, {
    nullable: false,
    description: 'Estadísticas de engagement y ventas del producto',
  })
  stats!: ProductStatsType;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Fecha de creación',
  })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'Fecha de última actualización',
  })
  updatedAt?: Date;
}
