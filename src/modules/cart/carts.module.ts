import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { CartsRepository } from './carts.repository';
import { CartsResolver } from './carts.resolver';
import { CartsService } from './carts.service';
import { Cart, CartSchema } from './schemas/carts.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    UsersModule,
    ProductsModule,
  ],
  providers: [CartsRepository, CartsService, CartsResolver],
  exports: [CartsService],
})
export class CartsModule {}
