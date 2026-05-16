import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BusinessSettings,
  BusinessSettingsSchema,
} from './schemas/business-settings.schema';
import { BusinessSettingsRepository } from './business-settings.repository';
import { BusinessSettingsResolver } from './business-settings.resolver';
import { BusinessSettingsService } from './business-settings.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: BusinessSettings.name, schema: BusinessSettingsSchema },
    ]),
  ],
  providers: [
    BusinessSettingsRepository,
    BusinessSettingsService,
    BusinessSettingsResolver,
  ],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
