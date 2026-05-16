import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesResolver } from './favorites.resolver';
import { FavoritesService } from './favorites.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
    UsersModule,
    ProductsModule,
  ],
  providers: [FavoritesService, FavoritesResolver, FavoritesRepository],
  exports: [FavoritesService],
})
export class FavoritesModule {}
