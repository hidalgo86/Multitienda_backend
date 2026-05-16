import {
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/schemas/users.schema';
import { AddToCartInput } from './dto/add-to-cart.input';
import { CartModel } from './model/cart.model';
import { CartsService } from './carts.service';

@Resolver(() => CartModel)
export class CartsResolver {
  constructor(private readonly cartsService: CartsService) {}

  private getUserIdFromContext(context: {
    req?: Request & { user?: { userId?: string; role?: string } };
  }): string {
    const userId = context.req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return userId;
  }

  private assertCustomerContext(context: {
    req?: Request & { user?: { role?: string } };
  }): void {
    if (context.req?.user?.role === UserRole.ADMINISTRADOR) {
      throw new ForbiddenException('Los administradores no usan carrito');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => CartModel, {
    description: 'Obtiene el carrito del usuario autenticado',
  })
  async myCart(
    @Context()
    context: {
      req?: Request & { user?: { userId?: string; role?: string } };
    },
  ): Promise<CartModel> {
    this.assertCustomerContext(context);
    const userId = this.getUserIdFromContext(context);
    return this.cartsService.getCartByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => CartModel, {
    description: 'Crea el carrito del usuario autenticado si todavia no existe',
  })
  async createMyCart(
    @Context()
    context: {
      req?: Request & { user?: { userId?: string; role?: string } };
    },
  ): Promise<CartModel> {
    this.assertCustomerContext(context);
    const userId = this.getUserIdFromContext(context);
    return this.cartsService.createCart({ userId });
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => CartModel, {
    description:
      'Agrega un producto al carrito autenticado, actualiza su cantidad o lo elimina con quantity 0',
  })
  async addToMyCart(
    @Args('input') input: AddToCartInput,
    @Context()
    context: { req?: Request & { user?: { userId?: string; role?: string } } },
  ): Promise<CartModel> {
    this.assertCustomerContext(context);
    const userId = this.getUserIdFromContext(context);
    return this.cartsService.addToCart(userId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, {
    description:
      'Elimina todos los productos del carrito del usuario autenticado',
  })
  async clearMyCart(
    @Context()
    context: {
      req?: Request & { user?: { userId?: string; role?: string } };
    },
  ): Promise<boolean> {
    this.assertCustomerContext(context);
    const userId = this.getUserIdFromContext(context);
    return this.cartsService.clearCart(userId);
  }
}
