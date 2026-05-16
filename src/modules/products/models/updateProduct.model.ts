// src/modules/products/models/updateProduct.model.ts
import {
  Genre,
  ProductState,
  ProductVariant,
  ProductImage,
} from '../schemas/products.schema';

export class UpdateProductModel {
  name?: string;
  categoryId?: string;
  genre?: Genre | null;
  description?: string;
  brand?: string;
  thumbnail?: string;

  // Variantes genéricas (talla, color, volumen, etc.)
  variants?: ProductVariant[];

  // Stock y precio para producto simple sin variantes
  stock?: number;
  price?: number;

  // galería de imágenes
  images?: ProductImage[];

  state?: ProductState;
}
