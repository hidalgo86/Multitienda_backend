// src/modules/products/application/delete.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '@/modules/products/products.repository';
import { ProductModel } from '../models/product.model';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { ProductState } from '../schemas/products.schema';

@Injectable()
export class SoftDeleteProductService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(id: string): Promise<ProductModel> {
    try {
      const product = await this.productsRepository.update(id, {
        state: ProductState.ELIMINADO,
      });
      if (!product) throw new NotFoundException('Producto no encontrado');
      return product;
    } catch (error) {
      // handleServiceError normalmente lanza, así que no hay problema
      handleServiceError(error as unknown, 'Error eliminando producto');
      // Esto es solo para que TypeScript no se queje, nunca se ejecutará
      throw error;
    }
  }
}
