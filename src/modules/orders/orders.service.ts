import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { PaginatedModel } from '@/common/models/paginated.model';
import { buildPagination } from '@/common/utils/pagination.util';
import { CartsService } from '../cart/carts.service';
import { ProductsRepository } from '../products/products.repository';
import {
  ProductAvailability,
  ProductState,
} from '../products/schemas/products.schema';
import { UsersService } from '../users/users.service';
import { OrderModel } from './model/order.model';
import { OrdersRepository } from './orders.repository';
import { OrderStatus, PaymentMethod } from './schemas/orders.schema';
import {
  CheckoutPaymentMethod,
  DeliveryMethod,
} from './dto/inputs/checkout.input';
import { OrdersQueryInput } from './dto/inputs/getOrders.input';
import { SubmitPaymentProofInput } from './dto/inputs/submitPaymentProof.input';

type ReservedItem = {
  productId: string;
  quantity: number;
  variantName?: string;
};

export const ORDER_PAYMENT_EXPIRATION_HOURS = 48;

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartsService: CartsService,
    private readonly productsRepository: ProductsRepository,
    private readonly usersService: UsersService,
  ) {}

  private validateObjectId(value: string, fieldName: string): void {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(
        `${fieldName} no es un ObjectId valido de MongoDB`,
      );
    }
  }

  private generatePaymentReference(): string {
    const random = randomBytes(6).toString('base64url');
    return `pay_${Date.now().toString(36)}_${random}`;
  }

  private formatOrderNumber(date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = randomBytes(3).toString('hex').toUpperCase();

    return `PED-${yyyy}${mm}${dd}-${random}`;
  }

  private formatLegacyOrderNumber(orderId: string): string {
    const shortId = orderId.slice(-6).toUpperCase() || 'ANTIGUO';
    return `PED-${shortId}`;
  }

  private async generateUniqueOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = this.formatOrderNumber();
      const existingOrder =
        await this.ordersRepository.findByOrderNumber(orderNumber);

      if (!existingOrder) {
        return orderNumber;
      }
    }

    throw new BadRequestException('No se pudo generar el numero de pedido');
  }

  private assertPaymentProofFromCloudinary(
    paymentProofUrl: string,
    paymentProofPublicId: string,
  ): void {
    let url: URL;

    try {
      url = new URL(paymentProofUrl);
    } catch {
      throw new BadRequestException('URL de comprobante invalida');
    }

    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com' ||
      !url.pathname.includes('/image/upload/')
    ) {
      throw new BadRequestException(
        'El comprobante debe ser una imagen valida de Cloudinary',
      );
    }

    if (!paymentProofPublicId.startsWith('payment-proofs/')) {
      throw new BadRequestException(
        'El comprobante debe estar en la carpeta payment-proofs',
      );
    }
  }

  private resolveVariant(
    product: {
      variants?: Array<{
        name: string;
        stock: number;
        price: number;
        image?: string;
      }>;
      price?: number;
      thumbnail?: string;
    },
    variantName?: string,
  ) {
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      if (variantName) {
        throw new BadRequestException(
          'El producto no tiene variantes para checkout',
        );
      }
      return null;
    }

    if (!variantName) {
      throw new BadRequestException(
        'Debes indicar la variante para completar la compra',
      );
    }

    const variant = product.variants.find(
      (item) =>
        item.name.trim().toLowerCase() === variantName.trim().toLowerCase(),
    );

    if (!variant) {
      throw new BadRequestException(
        `La variante ${variantName} ya no esta disponible`,
      );
    }

    return variant;
  }

  private buildAdminQuery(
    filters: OrdersQueryInput['filters'] = {},
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filters.orderId) {
      this.validateObjectId(filters.orderId, 'orderId');
      query._id = filters.orderId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    return query;
  }

  private async toModel(order: {
    id?: string;
    _id?: { toString(): string };
    orderNumber?: string;
    userId: string;
    items: OrderModel['items'];
    totalAmount: number;
    shippingAddress: OrderModel['shippingAddress'];
    deliveryMethod?: DeliveryMethod;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    paymentReceiptNumber?: string;
    paymentProofUrl?: string;
    paymentProofPublicId?: string;
    paymentProofSubmittedAt?: Date | null;
    paidAt?: Date | null;
    cancelledAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<OrderModel> {
    const id = order.id ?? order._id?.toString() ?? '';

    return {
      id,
      orderNumber: order.orderNumber ?? this.formatLegacyOrderNumber(id),
      userId: order.userId,
      user: await this.usersService.getUserById(order.userId),
      items: order.items,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      deliveryMethod: order.deliveryMethod ?? DeliveryMethod.PICKUP,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      paymentReceiptNumber: order.paymentReceiptNumber,
      paymentProofUrl: order.paymentProofUrl,
      paymentProofPublicId: order.paymentProofPublicId,
      paymentProofSubmittedAt: order.paymentProofSubmittedAt ?? undefined,
      paidAt: order.paidAt ?? undefined,
      cancelledAt: order.cancelledAt ?? undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async getOrderById(orderId: string): Promise<OrderModel> {
    this.validateObjectId(orderId, 'orderId');
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.toModel(order);
  }

  async myOrders(userId: string): Promise<OrderModel[]> {
    try {
      await this.usersService.getUserById(userId);
      const orders = await this.ordersRepository.findByUserId(userId);
      return Promise.all(orders.map((order) => this.toModel(order)));
    } catch (error) {
      handleServiceError(error, 'Error al listar ordenes');
    }
  }

  async getMyOrderById(userId: string, orderId: string): Promise<OrderModel> {
    try {
      await this.usersService.getUserById(userId);
      this.validateObjectId(orderId, 'orderId');
      const order = await this.ordersRepository.findById(orderId);
      if (!order || order.userId !== userId) {
        throw new NotFoundException('Orden no encontrada');
      }
      return this.toModel(order);
    } catch (error) {
      handleServiceError(error, 'Error al obtener orden');
    }
  }

  async findOrders(
    input?: OrdersQueryInput,
  ): Promise<PaginatedModel<OrderModel>> {
    try {
      const { page, limit, skip } = buildPagination(input?.pagination);
      const query = this.buildAdminQuery(input?.filters);
      const { items, total } = await this.ordersRepository.findWithFilters(
        query,
        skip,
        limit,
      );

      return new PaginatedModel<OrderModel>({
        items: await Promise.all(items.map((order) => this.toModel(order))),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      handleServiceError(error, 'Error al listar ordenes');
    }
  }

  async checkout(
    userId: string,
    input: {
      deliveryMethod?: DeliveryMethod;
      paymentMethod?: CheckoutPaymentMethod;
    } = {},
  ): Promise<OrderModel> {
    const reserved: ReservedItem[] = [];
    let orderCreated = false;

    try {
      const user = await this.usersService.getUserById(userId);
      const cart = await this.cartsService.getCartByUserId(userId);
      const deliveryMethod = input.deliveryMethod ?? DeliveryMethod.PICKUP;
      const paymentMethod =
        input.paymentMethod ?? CheckoutPaymentMethod.TRANSFER;
      const paymentReference =
        paymentMethod === CheckoutPaymentMethod.CASH
          ? 'cash_on_pickup'
          : 'bank_transfer';
      const shippingName = user.name?.trim() || undefined;
      const shippingPhone = user.phone?.trim() || undefined;
      const shippingAddress = user.address?.trim() || undefined;

      if (!cart.items.length) {
        throw new BadRequestException('El carrito esta vacio');
      }

      if (!user.isEmailVerified) {
        throw new BadRequestException(
          'Debes verificar tu correo antes de comprar',
        );
      }

      if (deliveryMethod === DeliveryMethod.DELIVERY) {
        if (!shippingName || !shippingPhone || !shippingAddress) {
          throw new BadRequestException(
            'Debes completar nombre, telefono y direccion antes de solicitar envio a domicilio',
          );
        }
      }

      const orderItems: OrderModel['items'] = [];
      let totalAmount = 0;
      const orderNumber = await this.generateUniqueOrderNumber();

      for (const item of cart.items) {
        const product = await this.productsRepository.findById(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Producto con id ${item.productId} no encontrado`,
          );
        }

        if (product.state === ProductState.ELIMINADO) {
          throw new BadRequestException(
            `El producto ${product.name} ya no esta disponible`,
          );
        }

        if (product.availability === ProductAvailability.AGOTADO) {
          throw new BadRequestException(
            `El producto ${product.name} esta agotado`,
          );
        }

        const variant = this.resolveVariant(product, item.variantName);
        const availableStock = variant ? variant.stock : (product.stock ?? 0);

        if (item.quantity > availableStock) {
          throw new BadRequestException(
            `No hay stock suficiente para ${product.name}`,
          );
        }

        const unitPrice = variant ? variant.price : (product.price ?? 0);
        const thumbnail = variant?.image ?? product.thumbnail;
        const lineTotal = unitPrice * item.quantity;

        orderItems.push({
          productId: product.id,
          variantName: variant?.name,
          quantity: item.quantity,
          productName: product.name,
          thumbnail,
          unitPrice,
          lineTotal,
        });
        totalAmount += lineTotal;
      }

      for (const item of orderItems) {
        const reservedOk = await this.productsRepository.reserveStock(
          item.productId,
          item.quantity,
          item.variantName,
        );

        if (!reservedOk) {
          throw new BadRequestException(
            `No se pudo reservar stock para ${item.productName}`,
          );
        }

        reserved.push({
          productId: item.productId,
          quantity: item.quantity,
          variantName: item.variantName,
        });
      }

      const createdOrder = await this.ordersRepository.create({
        orderNumber,
        userId,
        items: orderItems,
        totalAmount,
        shippingAddress: {
          address:
            deliveryMethod === DeliveryMethod.DELIVERY
              ? (shippingAddress ?? '')
              : 'Retiro en tienda',
          name:
            deliveryMethod === DeliveryMethod.DELIVERY
              ? shippingName
              : undefined,
          phone:
            deliveryMethod === DeliveryMethod.DELIVERY
              ? shippingPhone
              : undefined,
        },
        deliveryMethod,
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.MANUAL,
        paymentReference,
      });
      orderCreated = true;
      await this.cartsService.clearCart(userId);

      return this.toModel(createdOrder.toObject());
    } catch (error) {
      if (!orderCreated) {
        await Promise.all(
          reserved.map((item) =>
            this.productsRepository.restoreStock(
              item.productId,
              item.quantity,
              item.variantName,
            ),
          ),
        );
      }

      handleServiceError(error, 'Error al completar checkout');
    }
  }

  async payOrder(userId: string, orderId: string): Promise<OrderModel> {
    try {
      await this.getMyOrderById(userId, orderId);
      throw new BadRequestException(
        'El pago debe ser confirmado por administracion despues de revisar el comprobante',
      );
    } catch (error) {
      handleServiceError(error, 'Error al pagar orden');
    }
  }

  async submitPaymentProof(
    userId: string,
    input: SubmitPaymentProofInput,
  ): Promise<OrderModel> {
    try {
      const order = await this.getMyOrderById(userId, input.orderId);

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException(
          'No se puede cargar comprobante de una orden cancelada',
        );
      }

      if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('La orden ya fue confirmada como pagada');
      }

      const paymentReceiptNumber = input.paymentReceiptNumber.trim();
      const paymentProofUrl = input.paymentProofUrl.trim();
      const paymentProofPublicId = input.paymentProofPublicId.trim();
      if (!paymentReceiptNumber) {
        throw new BadRequestException('Debes indicar el numero de comprobante');
      }

      this.assertPaymentProofFromCloudinary(
        paymentProofUrl,
        paymentProofPublicId,
      );

      const updated = await this.ordersRepository.updatePaymentProof(order.id, {
        paymentReceiptNumber,
        paymentProofUrl,
        paymentProofPublicId,
        paymentProofSubmittedAt: new Date(),
      });

      if (!updated) {
        throw new NotFoundException('No se pudo actualizar la orden');
      }

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al cargar comprobante de pago');
    }
  }

  async adminPayOrder(orderId: string): Promise<OrderModel> {
    try {
      const order = await this.getOrderById(orderId);

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('No se puede pagar una orden cancelada');
      }

      if (order.status === OrderStatus.PAID) {
        return order;
      }

      const updated = await this.ordersRepository.updateLifecycle(orderId, {
        status: OrderStatus.PAID,
        paymentReference: this.generatePaymentReference(),
        paidAt: new Date(),
        cancelledAt: null,
      });

      if (!updated) {
        throw new NotFoundException('No se pudo actualizar la orden');
      }

      await Promise.all(
        updated.items.map((item) =>
          this.productsRepository.incrementPurchases(
            item.productId,
            item.quantity,
          ),
        ),
      );

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al pagar orden');
    }
  }

  async adminUnpayOrder(orderId: string): Promise<OrderModel> {
    try {
      const order = await this.getOrderById(orderId);

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException(
          'No se puede revertir el pago de una orden cancelada',
        );
      }

      if (order.status === OrderStatus.PENDING) {
        return order;
      }

      const updated = await this.ordersRepository.updateLifecycle(orderId, {
        status: OrderStatus.PENDING,
        paymentReference: null,
        paidAt: null,
      });

      if (!updated) {
        throw new NotFoundException('No se pudo actualizar la orden');
      }

      await Promise.all(
        updated.items.map((item) =>
          this.productsRepository.decrementPurchases(
            item.productId,
            item.quantity,
          ),
        ),
      );

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al revertir pago de orden');
    }
  }

  async cancelOrder(userId: string, orderId: string): Promise<OrderModel> {
    try {
      const order = await this.getMyOrderById(userId, orderId);

      if (order.status === OrderStatus.CANCELLED) {
        return order;
      }

      const updated = await this.ordersRepository.updateLifecycle(orderId, {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      });

      if (!updated) {
        throw new NotFoundException('No se pudo cancelar la orden');
      }

      await Promise.all(
        updated.items.map((item) =>
          this.productsRepository.restoreStock(
            item.productId,
            item.quantity,
            item.variantName,
          ),
        ),
      );

      if (order.status === OrderStatus.PAID) {
        await Promise.all(
          updated.items.map((item) =>
            this.productsRepository.decrementPurchases(
              item.productId,
              item.quantity,
            ),
          ),
        );
      }

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al cancelar orden');
    }
  }

  async adminCancelOrder(orderId: string): Promise<OrderModel> {
    try {
      const order = await this.getOrderById(orderId);

      if (order.status === OrderStatus.CANCELLED) {
        return order;
      }

      const updated = await this.ordersRepository.updateLifecycle(orderId, {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      });

      if (!updated) {
        throw new NotFoundException('No se pudo cancelar la orden');
      }

      await Promise.all(
        updated.items.map((item) =>
          this.productsRepository.restoreStock(
            item.productId,
            item.quantity,
            item.variantName,
          ),
        ),
      );

      if (order.status === OrderStatus.PAID) {
        await Promise.all(
          updated.items.map((item) =>
            this.productsRepository.decrementPurchases(
              item.productId,
              item.quantity,
            ),
          ),
        );
      }

      return this.toModel(updated);
    } catch (error) {
      handleServiceError(error, 'Error al cancelar orden');
    }
  }

  async cancelExpiredPendingOrders(now = new Date()): Promise<number> {
    try {
      const cutoff = new Date(
        now.getTime() - ORDER_PAYMENT_EXPIRATION_HOURS * 60 * 60 * 1000,
      );
      const expiredOrders =
        await this.ordersRepository.findExpiredPendingWithoutProof(cutoff);
      let cancelledCount = 0;

      for (const order of expiredOrders) {
        const orderId = order.id ?? order._id?.toString();

        if (!orderId) {
          continue;
        }

        const cancelled = await this.ordersRepository.cancelPendingById(
          orderId,
          now,
        );

        if (!cancelled) {
          continue;
        }

        await Promise.all(
          cancelled.items.map((item) =>
            this.productsRepository.restoreStock(
              item.productId,
              item.quantity,
              item.variantName,
            ),
          ),
        );
        cancelledCount += 1;
      }

      return cancelledCount;
    } catch (error) {
      handleServiceError(error, 'Error al cancelar ordenes vencidas');
    }
  }
}
