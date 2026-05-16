import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { ProductsRepository } from '../products/products.repository';
import { ProductModel } from '../products/models/product.model';
import {
  ProductAvailability,
  ProductState,
} from '../products/schemas/products.schema';
import { UsersService } from '../users/users.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { CreateCartInput } from './dto/create-cart.input';
import { CartItemModel, CartModel } from './model/cart.model';
import { CartsRepository } from './carts.repository';
import { CartDocument } from './schemas/carts.schema';

@Injectable()
export class CartsService {
  constructor(
    private readonly cartsRepository: CartsRepository,
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

  private normalizeVariantName(variantName?: string | null): string | null {
    const normalized = variantName?.trim().toLowerCase();
    return normalized && normalized.length > 0 ? normalized : null;
  }

  private sameVariant(a?: string | null, b?: string | null): boolean {
    return this.normalizeVariantName(a) === this.normalizeVariantName(b);
  }

  private async ensureUserExists(userId: string) {
    this.validateObjectId(userId, 'userId');
    return this.usersService.getUserById(userId);
  }

  private async ensureProductExists(productId: string) {
    this.validateObjectId(productId, 'productId');
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException(`Producto con id ${productId} no encontrado`);
    }

    if (product.state === ProductState.ELIMINADO) {
      throw new BadRequestException(
        'No se puede agregar un producto eliminado',
      );
    }

    if (product.availability === ProductAvailability.AGOTADO) {
      throw new BadRequestException('No se puede agregar un producto agotado');
    }

    return product;
  }

  private resolveVariant(product: ProductModel, variantName?: string) {
    const requestedVariantName = this.normalizeVariantName(variantName);

    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      if (requestedVariantName) {
        throw new BadRequestException(
          'Este producto no tiene variantes disponibles',
        );
      }
      return null;
    }

    if (!requestedVariantName) {
      throw new BadRequestException(
        'Debes indicar variantName para productos con variantes',
      );
    }

    const variant = product.variants.find(
      (item) => this.normalizeVariantName(item.name) === requestedVariantName,
    );

    if (!variant) {
      throw new BadRequestException(
        `La variante ${variantName} no existe para este producto`,
      );
    }

    return variant;
  }

  private getAvailableStock(
    product: ProductModel,
    variantName?: string,
  ): number {
    const variant = this.resolveVariant(product, variantName);
    if (variant) {
      return Math.max(variant.stock ?? 0, 0);
    }

    return Math.max(product.stock ?? 0, 0);
  }

  private validateRequestedQuantity(
    product: ProductModel,
    quantity: number,
    variantName?: string,
  ): void {
    if (quantity === 0) return;

    const availableStock = this.getAvailableStock(product, variantName);
    if (availableStock <= 0) {
      throw new BadRequestException('El producto no tiene stock disponible');
    }

    if (quantity > availableStock) {
      throw new BadRequestException(
        `La cantidad solicitada excede el stock disponible (${availableStock})`,
      );
    }
  }

  private buildSnapshot(product: ProductModel, variantName?: string) {
    const variant = this.resolveVariant(product, variantName);
    return {
      productName: product.name,
      variantName: variant?.name,
      thumbnail: variant?.image ?? product.thumbnail,
      unitPrice: variant?.price ?? product.price ?? 0,
    };
  }

  private async enrichItems(items: CartItemModel[]): Promise<CartItemModel[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await Promise.all(
      productIds.map((productId) =>
        this.productsRepository.findById(productId),
      ),
    );

    const productsMap = new Map(
      products
        .filter(Boolean)
        .map((product) => [String(product!.id), product!]),
    );

    return items.map((item) => ({
      productId: item.productId,
      variantName: item.variantName,
      quantity: item.quantity,
      snapshot: item.snapshot,
      product: productsMap.get(String(item.productId)) ?? null,
    }));
  }

  private async toCartModel(cart: {
    id?: string;
    _id?: Types.ObjectId;
    userId: string;
    items: CartItemModel[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<CartModel> {
    return {
      id: cart.id ?? cart._id?.toString() ?? '',
      userId: cart.userId,
      user: await this.usersService.getUserById(cart.userId),
      items: await this.enrichItems(cart.items ?? []),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private async getOrCreateCartDocument(userId: string): Promise<CartDocument> {
    return this.cartsRepository.findOrCreateByUserId(userId);
  }

  async createCart(input: CreateCartInput): Promise<CartModel> {
    try {
      await this.ensureUserExists(input.userId);
      const cart = await this.getOrCreateCartDocument(input.userId);
      return this.toCartModel(cart);
    } catch (error) {
      handleServiceError(error, 'Error al crear carrito');
    }
  }

  async getCartByUserId(userId: string): Promise<CartModel> {
    try {
      await this.ensureUserExists(userId);
      const cart = await this.getOrCreateCartDocument(userId);
      return this.toCartModel(cart);
    } catch (error) {
      handleServiceError(error, 'Error al obtener carrito');
    }
  }

  async addToCart(userId: string, input: AddToCartInput): Promise<CartModel> {
    try {
      await this.ensureUserExists(userId);
      const cart = await this.getOrCreateCartDocument(userId);
      const items = [...(cart.items ?? [])];
      const itemIndex = items.findIndex(
        (item) =>
          item.productId === input.productId &&
          this.sameVariant(item.variantName, input.variantName),
      );

      if (input.quantity === 0) {
        if (itemIndex === -1) {
          return this.toCartModel(cart);
        }

        items.splice(itemIndex, 1);
        const updatedCart = await this.cartsRepository.replaceItemsByUserId(
          userId,
          items,
        );

        if (!updatedCart) {
          throw new NotFoundException('No se pudo actualizar el carrito');
        }

        return this.toCartModel(updatedCart);
      }

      const product = await this.ensureProductExists(input.productId);
      this.validateRequestedQuantity(
        product,
        input.quantity,
        input.variantName,
      );
      const snapshot = this.buildSnapshot(product, input.variantName);
      const canonicalVariantName = snapshot.variantName;

      if (itemIndex === -1) {
        items.push({
          productId: input.productId,
          variantName: canonicalVariantName,
          quantity: input.quantity,
          snapshot,
        });
        await this.productsRepository.incrementCartAdds(input.productId);
      } else {
        const currentQuantity = items[itemIndex].quantity;
        items[itemIndex] = {
          ...items[itemIndex],
          variantName: canonicalVariantName,
          quantity: input.quantity,
          snapshot,
        };

        if (input.quantity > currentQuantity) {
          await this.productsRepository.incrementCartAdds(input.productId);
        }
      }

      const updatedCart = await this.cartsRepository.replaceItemsByUserId(
        userId,
        items,
      );

      if (!updatedCart) {
        throw new NotFoundException('No se pudo actualizar el carrito');
      }

      return this.toCartModel(updatedCart);
    } catch (error) {
      handleServiceError(error, 'Error al actualizar carrito');
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      await this.ensureUserExists(userId);
      await this.getOrCreateCartDocument(userId);
      await this.cartsRepository.replaceItemsByUserId(userId, []);
      return true;
    } catch (error) {
      handleServiceError(error, 'Error al limpiar carrito');
    }
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      this.validateObjectId(userId, 'userId');
      await this.cartsRepository.deleteByUserId(userId);
      return true;
    } catch (error) {
      handleServiceError(error, 'Error al eliminar carrito del usuario');
    }
  }
}
