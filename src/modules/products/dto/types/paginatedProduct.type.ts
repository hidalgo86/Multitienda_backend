// src/modules/products/dto/types/paginatedProduct.type.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ProductType } from './product.type';

@ObjectType({ description: 'Respuesta paginada de productos' })
export class PaginatedProductType {
  @Field(() => [ProductType], { description: 'Elementos de la página actual' })
  items!: ProductType[];

  @Field(() => Int, { description: 'Total de elementos' })
  total!: number;

  @Field(() => Int, { description: 'Número de página actual' })
  page!: number;

  @Field(() => Int, { description: 'Total de páginas' })
  totalPages!: number;
}
