import { Injectable, NotFoundException } from '@nestjs/common';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { UserRole } from '@/modules/users/schemas/users.schema';
import { ProductsRepository } from '@/modules/products/products.repository';
import { ProductModel } from '../models/product.model';
import { ProductState } from '../schemas/products.schema';

type FindProductActor = {
  role?: string;
  trackView?: boolean;
};

@Injectable()
export class FindByIdService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  private shouldTrackView(actor?: FindProductActor): boolean {
    if (actor?.trackView === false) {
      return false;
    }

    return actor?.role !== UserRole.ADMINISTRADOR;
  }

  async execute(id: string, actor?: FindProductActor): Promise<ProductModel> {
    try {
      const product = await this.productsRepository.findById(id);
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (
        product.state === ProductState.ELIMINADO &&
        actor?.role !== UserRole.ADMINISTRADOR
      ) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (this.shouldTrackView(actor)) {
        try {
          await this.productsRepository.incrementViews(id);
        } catch {
          // No bloquear la lectura por un fallo de analytics.
        }
      }

      return product;
    } catch (error) {
      handleServiceError(error as unknown, 'Error buscando producto');
      throw error;
    }
  }
}
