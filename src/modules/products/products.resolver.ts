// src/modules/products/products.resolver.ts
import { Query, Resolver, Args, Mutation, Context } from '@nestjs/graphql';
import type { Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/users.schema';
import { ProductsFacade } from './products.facade';
import { ProductsQueryModel } from './models/productsQuery.model';
import { ProductType } from './dto/types/product.type';
import { PaginatedProductType } from './dto/types/paginatedProduct.type';
import { ProductsQueryInput } from './dto/inputs/getProduct.input';
import { CreateProductInput } from './dto/inputs/createProduct.input';
import { CreateProductModel } from './models/createProduct.model';
import { UpdateProductInput } from './dto/inputs/updateProduct.input';
import { UpdateProductModel } from './models/updateProduct.model';

@Resolver()
export class ProductsResolver {
  constructor(private readonly productsFacade: ProductsFacade) {}

  // create a new product with optional image upload
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => ProductType)
  async createProduct(
    @Args('input') input: CreateProductInput,
  ): Promise<ProductType> {
    const model = new CreateProductModel(input);
    const product = await this.productsFacade.createProduct(model);
    return product;
  }

  // Find a product by ID
  @UseGuards(OptionalJwtAuthGuard)
  @Query(() => ProductType)
  async product(
    @Args('id') id: string,
    @Args('trackView', { type: () => Boolean, nullable: true })
    trackView: boolean | null,
    @Context()
    context: { req?: Request & { user?: { role?: string } } },
  ): Promise<ProductType> {
    return this.productsFacade.findById(id, {
      role: context.req?.user?.role,
      trackView: trackView ?? true,
    });
  }

  // Find products
  @UseGuards(OptionalJwtAuthGuard)
  @Query(() => PaginatedProductType)
  async products(
    @Args('input', { type: () => ProductsQueryInput, nullable: true })
    input?: ProductsQueryInput,
    @Context()
    context?: { req?: Request & { user?: { role?: string } } },
  ): Promise<PaginatedProductType> {
    const queryModel = new ProductsQueryModel({
      filters: input?.filters ?? {},
      pagination: input?.pagination,
    });
    return this.productsFacade.findProducts(queryModel, {
      role: context?.req?.user?.role,
    });
  }

  // update product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => ProductType)
  async updateProduct(
    @Args('id') id: string,
    @Args('input', { type: () => UpdateProductInput })
    input: UpdateProductInput,
  ): Promise<ProductType> {
    const model: UpdateProductModel = input;
    return this.productsFacade.updateProduct(id, model);
  }

  // delete product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => ProductType)
  async deleteProduct(@Args('id') id: string): Promise<ProductType> {
    return this.productsFacade.deleteProduct(id);
  }

  // restore product (soft delete -> active)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => ProductType)
  async restoreProduct(@Args('id') id: string): Promise<ProductType> {
    return this.productsFacade.restoreProduct(id);
  }
}
