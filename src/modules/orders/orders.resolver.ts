import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/users.schema';
import {
  CheckoutInput,
  CheckoutPaymentMethod,
  DeliveryMethod,
} from './dto/inputs/checkout.input';
import { OrdersQueryInput } from './dto/inputs/getOrders.input';
import { SubmitPaymentProofInput } from './dto/inputs/submitPaymentProof.input';
import { PaginatedOrderType } from './dto/types/paginatedOrder.type';
import { OrderModel } from './model/order.model';
import { OrdersService } from './orders.service';

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  private getUserIdFromContext(context: {
    req?: Request & { user?: { userId?: string } };
  }): string {
    const userId = context.req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return userId;
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [OrderModel], {
    description: 'Lista las ordenes del usuario autenticado',
  })
  async myOrders(
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<OrderModel[]> {
    return this.ordersService.myOrders(this.getUserIdFromContext(context));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Query(() => PaginatedOrderType, {
    description: 'Lista ordenes para administracion',
  })
  async adminOrders(
    @Args('input', { type: () => OrdersQueryInput, nullable: true })
    input?: OrdersQueryInput,
  ): Promise<PaginatedOrderType> {
    return this.ordersService.findOrders(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => OrderModel, {
    description: 'Obtiene una orden puntual del usuario autenticado',
  })
  async myOrder(
    @Args('orderId') orderId: string,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<OrderModel> {
    return this.ordersService.getMyOrderById(
      this.getUserIdFromContext(context),
      orderId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderModel, {
    description:
      'Completa la compra del carrito autenticado, descuenta stock y genera una orden',
  })
  async checkoutMyCart(
    @Args('input', { type: () => CheckoutInput, nullable: true })
    input: CheckoutInput | null,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<OrderModel> {
    return this.ordersService.checkout(this.getUserIdFromContext(context), {
      deliveryMethod: input?.deliveryMethod ?? DeliveryMethod.PICKUP,
      paymentMethod: input?.paymentMethod ?? CheckoutPaymentMethod.TRANSFER,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderModel, {
    description:
      'Marca como pagada una orden pendiente del usuario autenticado',
  })
  async payMyOrder(
    @Args('orderId') orderId: string,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<OrderModel> {
    return this.ordersService.payOrder(
      this.getUserIdFromContext(context),
      orderId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderModel, {
    description:
      'Carga el comprobante de pago de una orden pendiente del usuario autenticado',
  })
  async submitPaymentProof(
    @Args('input') input: SubmitPaymentProofInput,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<OrderModel> {
    return this.ordersService.submitPaymentProof(
      this.getUserIdFromContext(context),
      input,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => OrderModel, {
    description: 'Marca como pagada una orden desde administracion',
  })
  async adminPayOrder(@Args('orderId') orderId: string): Promise<OrderModel> {
    return this.ordersService.adminPayOrder(orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => OrderModel, {
    description: 'Revierte una orden pagada a pendiente desde administracion',
  })
  async adminUnpayOrder(@Args('orderId') orderId: string): Promise<OrderModel> {
    return this.ordersService.adminUnpayOrder(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderModel, {
    description:
      'Cancela una orden del usuario autenticado y devuelve el stock reservado',
  })
  async cancelMyOrder(
    @Args('orderId') orderId: string,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<OrderModel> {
    return this.ordersService.cancelOrder(
      this.getUserIdFromContext(context),
      orderId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => OrderModel, {
    description: 'Cancela una orden desde administracion',
  })
  async adminCancelOrder(
    @Args('orderId') orderId: string,
  ): Promise<OrderModel> {
    return this.ordersService.adminCancelOrder(orderId);
  }
}
