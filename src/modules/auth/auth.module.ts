import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { EmailModule } from '@/common/email/email.module';
import { UsersModule } from '../users/users.module';
import { readJwtKey } from './utils/jwt-keys.util';
import { CartsModule } from '../cart/carts.module';
import { FavoritesModule } from '../favorites/favorites.module';

@Module({
  imports: [
    EmailModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: readJwtKey(configService, 'PRIVATE'),
        publicKey: readJwtKey(configService, 'PUBLIC'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: '1h',
        },
      }),
    }),
    UsersModule,
    CartsModule,
    FavoritesModule,
  ],
  controllers: [],
  providers: [AuthService, JwtStrategy, AuthResolver],
  exports: [AuthService], // <-- Exporta el servicio aquí
})
export class AuthModule {}
