// src/modules/products/models/createProduct.model.ts
import {
  Genre,
  ProductVariant,
  ProductImage,
} from '../schemas/products.schema';

export class CreateProductModel {
  name!: string;
  categoryId!: string;
  genre?: Genre; // cuando aplique
  description?: string;
  brand?: string;
  thumbnail?: string;

  // Variantes genéricas (talla, color, volumen, etc.)
  variants?: ProductVariant[];

  // Stock y precio para producto simple sin variantes
  stock?: number;
  price?: number;

  // Galería de imágenes
  images?: ProductImage[];

  constructor(partial: Partial<CreateProductModel>) {
    Object.assign(this, partial);
  }
}
