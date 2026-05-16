// src/modules/products/application/update-product.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsRepository } from '@/modules/products/products.repository';
import { UpdateProductModel } from '../models/updateProduct.model';
import { ProductState, ProductVariant } from '../schemas/products.schema';
import { ProductModel } from '../models/product.model';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import {
  Category,
  CategoryDocument,
} from '@/modules/categories/schemas/category.schema';

@Injectable()
export class UpdateProductService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async execute(id: string, body: UpdateProductModel): Promise<ProductModel> {
    try {
      const current = await this.productsRepository.findById(id);
      if (!current) throw new NotFoundException('Producto no encontrado');

      const bodyWithImmutableFields = body as UpdateProductModel & {
        sku?: string;
        slug?: string;
      };

      if (
        bodyWithImmutableFields.sku !== undefined &&
        bodyWithImmutableFields.sku !== current.sku
      ) {
        throw new BadRequestException(
          'El SKU no se puede modificar. Es único e inmutable.',
        );
      }

      if (
        bodyWithImmutableFields.slug !== undefined &&
        bodyWithImmutableFields.slug !== current.slug
      ) {
        throw new BadRequestException(
          'El slug no se puede modificar. Es único e inmutable.',
        );
      }

      const updateData: Partial<ProductModel> = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.categoryId !== undefined) {
        const category = await this.categoryModel
          .findById(body.categoryId)
          .exec();
        if (!category) {
          throw new BadRequestException('Categoría no existe');
        }
        updateData.categoryId = body.categoryId;
      }
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.brand !== undefined) updateData.brand = body.brand;
      if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;
      if (body.genre !== undefined) updateData.genre = body.genre ?? undefined;
      if (body.images !== undefined) updateData.images = body.images;
      if (body.stock !== undefined) {
        const stock = Number(body.stock);
        if (isNaN(stock) || stock < 0) {
          throw new BadRequestException('El stock no puede ser negativo');
        }
        updateData.stock = stock;
      }

      if (body.price !== undefined) {
        const price = Number(body.price);
        if (isNaN(price) || price < 0) {
          throw new BadRequestException('El precio no puede ser negativo');
        }
        updateData.price = price;
      }

      if (Array.isArray(body.variants)) {
        const nextVariants: ProductVariant[] = body.variants.map((v) => {
          const name = String(v.name ?? '').trim();
          if (!name) throw new BadRequestException('variant.name requerido');
          const stock = v.stock !== undefined ? Number(v.stock) : 0;
          if (isNaN(stock) || stock < 0)
            throw new BadRequestException(
              'El stock de variante no puede ser negativo',
            );
          const price = v.price !== undefined ? Number(v.price) : 0;
          if (isNaN(price) || price < 0)
            throw new BadRequestException(
              'El precio de variante no puede ser negativo',
            );
          return { name, stock, price, image: v.image };
        });

        const normalizedVariantNames = new Set(
          nextVariants.map((variant) => variant.name.trim().toLowerCase()),
        );
        if (normalizedVariantNames.size !== nextVariants.length) {
          throw new BadRequestException(
            'Los nombres de variantes no deben repetirse',
          );
        }

        updateData.variants = nextVariants;
        if (nextVariants.length > 0) {
          // Un producto con variantes no usa stock ni precio global
          updateData.stock = undefined;
          updateData.price = undefined;
        }
      }

      const wantsDelete = body.state === ProductState.ELIMINADO;

      if (wantsDelete) {
        updateData.state = ProductState.ELIMINADO;
      } else if (body.state !== undefined) {
        updateData.state = body.state;
      }

      const hasNextVariants = 'variants' in updateData;
      const hasNextStock = 'stock' in updateData;
      const hasNextPrice = 'price' in updateData;
      const nextVariants = hasNextVariants
        ? updateData.variants
        : current.variants;
      const nextStock = hasNextStock ? updateData.stock : current.stock;
      const nextPrice = hasNextPrice ? updateData.price : current.price;

      if (
        Array.isArray(nextVariants) &&
        nextVariants.length > 0 &&
        nextStock !== undefined
      ) {
        throw new BadRequestException(
          'Los productos con variantes no usan stock general',
        );
      }

      if (
        Array.isArray(nextVariants) &&
        nextVariants.length > 0 &&
        nextPrice !== undefined
      ) {
        throw new BadRequestException(
          'Los productos con variantes no usan precio general',
        );
      }

      const updated = await this.productsRepository.update(id, updateData);
      if (!updated)
        throw new NotFoundException('No se pudo actualizar el producto');
      return updated;
    } catch (error) {
      handleServiceError(error as unknown, 'Error actualizando producto');
      throw error;
    }
  }
}
