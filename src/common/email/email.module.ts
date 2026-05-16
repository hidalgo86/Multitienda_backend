// src/common/services/email.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { BusinessSettingsModule } from '@/modules/business-settings/business-settings.module';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule, // Importa ConfigModule para que EmailService pueda usar ConfigService
    BusinessSettingsModule,
  ],
  providers: [EmailService],
  exports: [EmailService], // Exporta EmailService para que otros módulos puedan usarlo
})
export class EmailModule {}
