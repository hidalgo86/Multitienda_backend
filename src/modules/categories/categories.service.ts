import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CategoryModel } from './models/category.model';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { ProductsRepository } from '@/modules/products/products.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async create(input: {
    name: string;
    slug: string;
    parentId?: string;
  }): Promise<CategoryModel> {
    try {
      // Validar slug único
      const existingSlug = await this.categoriesRepository.slugExists(
        input.slug,
      );
      if (existingSlug) {
        throw new BadRequestException(
          `El slug "${input.slug}" ya existe. Debe ser único.`,
        );
      }

      // Si hay parentId, validar que exista
      if (input.parentId) {
        const parent = await this.categoriesRepository.findById(input.parentId);
        if (!parent) {
          throw new BadRequestException('La categoría padre no existe.');
        }
      }

      const category = await this.categoriesRepository.create(input);
      return category;
    } catch (error: unknown) {
      handleServiceError(error, 'Error creating category');
      throw error;
    }
  }

  async findById(id: string): Promise<CategoryModel> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<CategoryModel> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Categoría con slug ${slug} no encontrada`);
    }
    return category;
  }

  async findAll(): Promise<CategoryModel[]> {
    return this.categoriesRepository.findAll();
  }

  async update(
    id: string,
    input: { name?: string; slug?: string; parentId?: string },
  ): Promise<CategoryModel> {
    try {
      const category = await this.findById(id);

      // Si se intenta cambiar el slug, validar uniqueness
      if (input.slug && input.slug !== category.slug) {
        const existingSlug = await this.categoriesRepository.slugExists(
          input.slug,
          id,
        );
        if (existingSlug) {
          throw new BadRequestException(
            `El slug "${input.slug}" ya existe. Debe ser único.`,
          );
        }
      }

      // Si hay parentId, validar que exista y no sea la misma categoría
      if (input.parentId) {
        if (input.parentId === id) {
          throw new BadRequestException(
            'Una categoría no puede ser su propia padre.',
          );
        }
        const parent = await this.categoriesRepository.findById(input.parentId);
        if (!parent) {
          throw new BadRequestException('La categoría padre no existe.');
        }
      }

      const updated = await this.categoriesRepository.update(id, input);
      if (!updated) {
        throw new NotFoundException('No se pudo actualizar la categoría');
      }
      return updated;
    } catch (error: unknown) {
      handleServiceError(error, 'Error updating category');
      throw error;
    }
  }

  async delete(id: string): Promise<CategoryModel> {
    try {
      const category = await this.findById(id);
      const productsCount = await this.productsRepository.countByCategoryId(id);

      if (productsCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar la categoria "${category.name}" porque tiene ${productsCount} producto${productsCount === 1 ? '' : 's'} asociado${productsCount === 1 ? '' : 's'}.`,
        );
      }

      const deleted = await this.categoriesRepository.delete(id);
      if (!deleted) {
        throw new NotFoundException('No se pudo eliminar la categoría');
      }
      return deleted;
    } catch (error: unknown) {
      handleServiceError(error, 'Error deleting category');
      throw error;
    }
  }
}
