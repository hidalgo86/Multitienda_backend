import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Banner, BannerSchema } from './schemas/banner.schema';
import { BannersRepository } from './banners.repository';
import { BannersService } from './banners.service';
import { BannersResolver } from './banners.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Banner.name, schema: BannerSchema }]),
  ],
  providers: [BannersRepository, BannersService, BannersResolver],
  exports: [BannersRepository, BannersService, MongooseModule],
})
export class BannersModule {}
