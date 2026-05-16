import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { CategoriesResolver } from './categories.resolver';
import { CategoriesSeed } from './categories.seed';
import {
  Product,
  ProductSchema,
} from '@/modules/products/schemas/products.schema';
import { ProductsRepository } from '@/modules/products/products.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [
    CategoriesRepository,
    ProductsRepository,
    CategoriesService,
    CategoriesResolver,
    CategoriesSeed,
  ],
  exports: [
    MongooseModule,
    CategoriesService,
    CategoriesRepository,
    CategoriesSeed,
  ],
})
export class CategoriesModule {}
