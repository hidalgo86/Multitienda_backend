import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { ProductModel } from '../products/models/product.model';
import { ProductsRepository } from '../products/products.repository';
import {
  ProductAvailability,
  ProductState,
} from '../products/schemas/products.schema';
import { UsersService } from '../users/users.service';
import { AddFavoriteInput } from './dto/add-favorite.input';
import { FavoriteModel } from './model/favorite.model';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favoritesRepository: FavoritesRepository,
    private readonly usersService: UsersService,
    private readonly productsRepository: ProductsRepository,
  ) {}

  private validateObjectId(value: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `${fieldName} no es un ObjectId valido de MongoDB`,
      );
    }
  }

  private async ensureUserExists(userId: string) {
    this.validateObjectId(userId, 'userId');
    return this.usersService.getUserById(userId);
  }

  private async ensureFavoriteProduct(
    productId: string,
  ): Promise<ProductModel> {
    this.validateObjectId(productId, 'productId');
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException(`Producto con id ${productId} no encontrado`);
    }

    if (product.state === ProductState.ELIMINADO) {
      throw new BadRequestException(
        'No se puede agregar a favoritos un producto eliminado',
      );
    }

    if (product.availability === ProductAvailability.AGOTADO) {
      throw new BadRequestException(
        'No se puede agregar a favoritos un producto agotado',
      );
    }

    return product;
  }

  private async enrichProducts(productIds: string[]) {
    const products = await Promise.all(
      productIds.map((productId) =>
        this.productsRepository.findById(productId),
      ),
    );

    return products.filter(Boolean) as ProductModel[];
  }

  private async toModel(favorite: {
    id?: string;
    _id?: Types.ObjectId;
    userId: string;
    products?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<FavoriteModel> {
    const productIds = favorite.products ?? [];

    return {
      id: favorite.id ?? favorite._id?.toString() ?? '',
      userId: favorite.userId,
      user: await this.usersService.getUserById(favorite.userId),
      productIds,
      products: await this.enrichProducts(productIds),
      createdAt: favorite.createdAt,
      updatedAt: favorite.updatedAt,
    };
  }

  async getMyFavorites(userId: string): Promise<FavoriteModel> {
    try {
      await this.ensureUserExists(userId);
      const favorite =
        await this.favoritesRepository.findOrCreateByUserId(userId);
      return this.toModel(favorite);
    } catch (error) {
      handleServiceError(error, 'Error al obtener favoritos');
    }
  }

  async addProduct(
    userId: string,
    input: AddFavoriteInput,
  ): Promise<FavoriteModel> {
    try {
      await this.ensureUserExists(userId);
      await this.ensureFavoriteProduct(input.productId);
      const { updated, added } =
        await this.favoritesRepository.addProductAndReturn(
          userId,
          input.productId,
        );

      if (added) {
        await this.productsRepository.incrementFavorites(input.productId);
      }

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al agregar favorito');
    }
  }

  async removeProduct(
    userId: string,
    productId: string,
  ): Promise<FavoriteModel> {
    try {
      await this.ensureUserExists(userId);
      this.validateObjectId(productId, 'productId');
      const { updated, removed } =
        await this.favoritesRepository.removeProductAndReturn(
          userId,
          productId,
        );

      if (removed) {
        await this.productsRepository.decrementFavorites(productId);
      }

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al quitar favorito');
    }
  }

  async toggleProduct(
    userId: string,
    input: AddFavoriteInput,
  ): Promise<FavoriteModel> {
    try {
      await this.ensureUserExists(userId);
      this.validateObjectId(input.productId, 'productId');
      const current =
        await this.favoritesRepository.findOrCreateByUserId(userId);
      const exists = current.products.includes(input.productId);

      if (exists) {
        return this.removeProduct(userId, input.productId);
      }

      return this.addProduct(userId, input);
    } catch (error) {
      handleServiceError(error, 'Error al alternar favorito');
    }
  }

  async clearMyFavorites(userId: string): Promise<boolean> {
    try {
      await this.ensureUserExists(userId);
      const current =
        await this.favoritesRepository.findOrCreateByUserId(userId);
      const uniqueProductIds = [...new Set(current.products)];

      if (uniqueProductIds.length === 0) {
        return true;
      }

      await Promise.all(
        uniqueProductIds.map((productId) =>
          this.productsRepository.decrementFavorites(productId),
        ),
      );
      await this.favoritesRepository.replaceProductsByUserId(userId, []);

      return true;
    } catch (error) {
      handleServiceError(error, 'Error al limpiar favoritos');
    }
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      this.validateObjectId(userId, 'userId');
      const current = await this.favoritesRepository.findByUserId(userId);
      const uniqueProductIds = [...new Set(current?.products ?? [])];

      await Promise.all(
        uniqueProductIds.map((productId) =>
          this.productsRepository.decrementFavorites(productId),
        ),
      );
      await this.favoritesRepository.deleteByUserId(userId);

      return true;
    } catch (error) {
      handleServiceError(error, 'Error al eliminar favoritos del usuario');
    }
  }
}
