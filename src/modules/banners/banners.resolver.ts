import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/users.schema';
import { BannersService } from './banners.service';
import { CreateBannerInput } from './dto/inputs/createBanner.input';
import { UpdateBannerInput } from './dto/inputs/updateBanner.input';
import { BannerType } from './dto/types/banner.type';

@Resolver()
export class BannersResolver {
  constructor(private readonly bannersService: BannersService) {}

  @Query(() => [BannerType], { description: 'Listar banners activos' })
  async banners(): Promise<BannerType[]> {
    return await this.bannersService.findActive();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Query(() => [BannerType], {
    description: 'Listar todos los banners para administracion',
  })
  async adminBanners(): Promise<BannerType[]> {
    return await this.bannersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => BannerType, { description: 'Crear banner' })
  async createBanner(
    @Args('input') input: CreateBannerInput,
  ): Promise<BannerType> {
    return await this.bannersService.create(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => BannerType, { description: 'Actualizar banner' })
  async updateBanner(
    @Args('id') id: string,
    @Args('input') input: UpdateBannerInput,
  ): Promise<BannerType> {
    return await this.bannersService.update(id, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => BannerType, { description: 'Eliminar banner' })
  async deleteBanner(@Args('id') id: string): Promise<BannerType> {
    return await this.bannersService.delete(id);
  }
}
