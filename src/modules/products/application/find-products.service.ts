import { Injectable } from '@nestjs/common';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { ProductsRepository } from '@/modules/products/products.repository';
import { UserRole } from '@/modules/users/schemas/users.schema';
import { ProductsQueryModel } from '../models/productsQuery.model';
import { ProductState } from '../schemas/products.schema';

@Injectable()
export class FindProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  private hasSearchText(value?: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isAdmin(actor?: { role?: string }): boolean {
    return actor?.role === UserRole.ADMINISTRADOR;
  }

  private buildPublicEmptyPage(input?: ProductsQueryModel) {
    return {
      items: [],
      total: 0,
      page: Math.max(input?.pagination?.page ?? 1, 1),
      totalPages: 1,
    };
  }

  async execute(input?: ProductsQueryModel, actor?: { role?: string }) {
    try {
      const queryModel = new ProductsQueryModel(input);
      const filters = queryModel.filters || {};
      const canSeeDeleted = this.isAdmin(actor);

      if (!canSeeDeleted) {
        if (filters.state === ProductState.ELIMINADO) {
          return this.buildPublicEmptyPage(queryModel);
        }

        filters.includeDeleted = false;
      }

      if (filters.minPrice !== undefined && filters.minPrice < 0) {
        throw new Error('El precio minimo no puede ser negativo');
      }

      if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
        throw new Error('El precio maximo no puede ser negativo');
      }

      if (
        filters.minPrice !== undefined &&
        filters.maxPrice !== undefined &&
        filters.minPrice > filters.maxPrice
      ) {
        throw new Error('El precio minimo no puede ser mayor que el maximo');
      }

      if (
        filters.maxPrice !== undefined &&
        filters.minPrice !== undefined &&
        filters.maxPrice < filters.minPrice
      ) {
        throw new Error('El precio maximo no puede ser menor que el minimo');
      }

      const paginated =
        await this.productsRepository.findWithFiltersQueryModel(queryModel);

      if (this.hasSearchText(filters.name) && paginated.items.length > 0) {
        await Promise.allSettled(
          paginated.items.map((product) =>
            this.productsRepository.incrementSearches(product.id),
          ),
        );
      }

      return paginated;
    } catch (error) {
      handleServiceError(error as unknown, 'Error listando productos');
      throw error;
    }
  }
}
