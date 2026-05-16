import {
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/schemas/users.schema';
import { AddFavoriteInput } from './dto/add-favorite.input';
import { RemoveFavoriteInput } from './dto/remove-favorite.input';
import { FavoriteModel } from './model/favorite.model';
import { FavoritesService } from './favorites.service';

@Resolver(() => FavoriteModel)
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService) {}

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
      throw new ForbiddenException('Los administradores no usan favoritos');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => FavoriteModel, {
    description: 'Obtiene los favoritos del usuario autenticado',
  })
  async myFavorites(
    @Context()
    context: {
      req?: Request & { user?: { userId?: string; role?: string } };
    },
  ): Promise<FavoriteModel> {
    this.assertCustomerContext(context);
    return this.favoritesService.getMyFavorites(
      this.getUserIdFromContext(context),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => FavoriteModel, {
    description: 'Agrega un producto a favoritos del usuario autenticado',
  })
  async addToFavorites(
    @Args('input') input: AddFavoriteInput,
    @Context()
    context: { req?: Request & { user?: { userId?: string; role?: string } } },
  ): Promise<FavoriteModel> {
    this.assertCustomerContext(context);
    return this.favoritesService.addProduct(
      this.getUserIdFromContext(context),
      input,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => FavoriteModel, {
    description: 'Quita un producto de favoritos del usuario autenticado',
  })
  async removeFromFavorites(
    @Args('input') input: RemoveFavoriteInput,
    @Context()
    context: { req?: Request & { user?: { userId?: string; role?: string } } },
  ): Promise<FavoriteModel> {
    this.assertCustomerContext(context);
    return this.favoritesService.removeProduct(
      this.getUserIdFromContext(context),
      input.productId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => FavoriteModel, {
    description: 'Alterna un producto en favoritos del usuario autenticado',
  })
  async toggleFavorite(
    @Args('input') input: AddFavoriteInput,
    @Context()
    context: { req?: Request & { user?: { userId?: string; role?: string } } },
  ): Promise<FavoriteModel> {
    this.assertCustomerContext(context);
    return this.favoritesService.toggleProduct(
      this.getUserIdFromContext(context),
      input,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, {
    description: 'Limpia todos los favoritos del usuario autenticado',
  })
  async clearMyFavorites(
    @Context()
    context: {
      req?: Request & { user?: { userId?: string; role?: string } };
    },
  ): Promise<boolean> {
    this.assertCustomerContext(context);
    return this.favoritesService.clearMyFavorites(
      this.getUserIdFromContext(context),
    );
  }
}
