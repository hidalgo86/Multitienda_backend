import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartsModule } from '../cart/carts.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { Order, OrderSchema } from './schemas/orders.schema';
import { OrdersRepository } from './orders.repository';
import { OrdersExpirationService } from './orders-expiration.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    CartsModule,
    ProductsModule,
    UsersModule,
  ],
  providers: [
    OrdersRepository,
    OrdersService,
    OrdersResolver,
    OrdersExpirationService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
