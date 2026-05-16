// src/modules/products/models/product.model.ts
import {
  ProductState,
  ProductAvailability,
  Genre,
  ProductVariant,
  ProductImage,
} from '../schemas/products.schema';

import { ProductStats } from '../schemas/products.schema';

export class ProductModel {
  id!: string;
  sku!: string;
  slug!: string;
  categoryId!: string;
  name!: string;
  description?: string;
  brand?: string;
  thumbnail?: string;
  genre?: Genre;
  variants?: ProductVariant[];
  stock?: number;
  price?: number;
  images?: ProductImage[];
  state!: ProductState;
  availability!: ProductAvailability;
  stats!: ProductStats;
  createdAt?: Date;
  updatedAt?: Date;
}
