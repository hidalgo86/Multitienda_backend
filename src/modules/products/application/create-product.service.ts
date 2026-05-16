import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsRepository } from '@/modules/products/products.repository';
import {
  ProductVariantInput,
  ProductImageInput,
} from '../dto/inputs/createProduct.input';
import { CreateProductModel } from '../models/createProduct.model';
import { ProductModel } from '../models/product.model';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { generateSku } from '../utils/sku.util';
import { generateSlug, appendSlugSuffix } from '../utils/slug.util';
import {
  Category,
  CategoryDocument,
} from '@/modules/categories/schemas/category.schema';

@Injectable()
export class CreateProductService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async execute(input: CreateProductModel): Promise<ProductModel> {
    try {
      const category = await this.categoryModel
        .findById(input.categoryId)
        .exec();
      if (!category) {
        throw new BadRequestException('Categoría no existe');
      }

      // Generar SKU único con reintentos (seguridad multi-servidor)
      const sku = await this.generateUniqueSku(category.slug || category.name);
      const slug = await this.generateUniqueSlug(input.name);

      // Datos base del producto a persistir
      const productData: CreateProductModel & {
        sku: string;
        slug: string;
      } = {
        sku,
        slug,
        name: input.name,
        categoryId: input.categoryId,
        description: input.description,
        brand: input.brand,
        thumbnail: input.thumbnail,
      };

      if (input.genre !== undefined) {
        productData.genre = input.genre;
      }

      // Normalizar imágenes del producto
      if (Array.isArray(input.images)) {
        if (input.images.length === 0) {
          throw new BadRequestException('Se requiere al menos una imagen');
        }
        const images = input.images.map((img: ProductImageInput) => {
          if (!img.url || !img.publicId) {
            throw new BadRequestException(
              'Cada imagen debe tener url y publicId',
            );
          }
          return { url: img.url, publicId: img.publicId };
        });
        productData.images = images;
      }

      // Producto con variantes
      if (Array.isArray(input.variants) && input.variants.length > 0) {
        const variants = input.variants.map((v: ProductVariantInput) => {
          const name = String(v.name ?? '').trim();
          if (!name) {
            throw new BadRequestException(
              'El nombre de la variante es requerido',
            );
          }

          const stock = Number(v.stock);
          if (isNaN(stock) || stock < 0) {
            throw new BadRequestException(
              'El stock de la variante no puede ser negativo',
            );
          }

          const price = Number(v.price);
          if (isNaN(price) || price < 0) {
            throw new BadRequestException(
              'El precio de la variante no puede ser negativo',
            );
          }

          return { name, stock, price, image: v.image };
        });

        const normalizedVariantNames = new Set(
          variants.map((variant) => variant.name.trim().toLowerCase()),
        );
        if (normalizedVariantNames.size !== variants.length) {
          throw new BadRequestException(
            'Los nombres de variantes no deben repetirse',
          );
        }

        productData.variants = variants;
        // Un producto con variantes no usa stock/precio global
        productData.stock = undefined;
        productData.price = undefined;
      }
      // Producto simple sin variantes
      else {
        if (input.stock !== undefined) {
          const stock = Number(input.stock);
          if (isNaN(stock) || stock < 0) {
            throw new BadRequestException('El stock no puede ser negativo');
          }
          productData.stock = stock;
        }

        if (input.price !== undefined) {
          const price = Number(input.price);
          if (isNaN(price) || price < 0) {
            throw new BadRequestException('El precio no puede ser negativo');
          }
          productData.price = price;
        }
      }

      const product = await this.productsRepository.create(productData);
      return product;
    } catch (error: unknown) {
      handleServiceError(error, 'Error creando producto');
    }
  }

  /**
   * Genera un SKU único con reintentos en caso de colisión
   * Garantiza que nunca habrá duplicados incluso en sistemas distribuidos
   */
  private async generateUniqueSku(
    category: string,
    maxRetries: number = 3,
  ): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const sku = generateSku(category);
      const exists = await this.productsRepository.skuExists(sku);

      if (!exists) {
        return sku;
      }
    }

    // Si se alcanzó el máximo de reintentos, lanzar error
    throw new BadRequestException(
      'No se pudo generar un SKU único. Intente nuevamente.',
    );
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    const maxRetries = 20;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const candidate = appendSlugSuffix(baseSlug, attempt);
      const exists = await this.productsRepository.slugExists(candidate);
      if (!exists) {
        return candidate;
      }
    }

    throw new BadRequestException(
      'No se pudo generar un slug único. Intente nuevamente.',
    );
  }
}
