import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/users.schema';
import { BusinessSettingsService } from './business-settings.service';
import { UpdateBusinessSettingsInput } from './dto/inputs/update-business-settings.input';
import { BusinessSettingsType } from './dto/types/business-settings.type';

@Resolver()
export class BusinessSettingsResolver {
  constructor(private readonly settingsService: BusinessSettingsService) {}

  @Query(() => BusinessSettingsType, {
    description: 'Configuracion publica del negocio',
  })
  async businessSettings(): Promise<BusinessSettingsType> {
    return this.settingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => BusinessSettingsType, {
    description: 'Actualizar configuracion del negocio',
  })
  async updateBusinessSettings(
    @Args('input') input: UpdateBusinessSettingsInput,
  ): Promise<BusinessSettingsType> {
    return this.settingsService.updateSettings(input);
  }
}
