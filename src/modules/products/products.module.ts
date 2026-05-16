import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/products.schema';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsFacade } from './products.facade';
import { FindByIdService } from './application/find-by-id.service';
import { UpdateProductService } from './application/update-product.service';
import { SoftDeleteProductService } from './application/delete.service';
import { ProductsResolver } from './products.resolver';
import { ProductsRepository } from '@/modules/products/products.repository';
import { CreateProductService } from './application/create-product.service';
import { FindProductsService } from './application/find-products.service';
import { ProductStatsService } from './application/product-stats.service';
import './dto/enums.graphql';

@Module({
  imports: [
    CategoriesModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [
    ProductsRepository,
    ProductsResolver,
    ProductsFacade,
    CreateProductService,
    FindByIdService,
    FindProductsService,
    UpdateProductService,
    SoftDeleteProductService,
    ProductStatsService,
  ],
  exports: [
    ProductsRepository,
    ProductsFacade,
    CreateProductService,
    FindByIdService,
    FindProductsService,
    UpdateProductService,
    SoftDeleteProductService,
    ProductStatsService,
  ],
})
export class ProductsModule {}
