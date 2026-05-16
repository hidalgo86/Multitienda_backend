import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@/modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProductsModule } from '@/modules/products/products.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { CartsModule } from '@/modules/cart/carts.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { FavoritesModule } from '@/modules/favorites/favorites.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { UsersModule } from '@/modules/users/users.module';
import { BannersModule } from '@/modules/banners/banners.module';
import type { Request, Response } from 'express';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GqlThrottlerGuard } from '@/common/guards/graphql-throttler.guard';
import { graphQLSecurityRule } from '@/common/graphql/security-rules';
import { RequestContextMiddleware } from '@/common/middleware/request-context.middleware';
import { GraphqlTracingInterceptor } from '@/common/interceptors/graphql-tracing.interceptor';
import { AuditModule } from '@/modules/audit/audit.module';
import { BusinessSettingsModule } from '@/modules/business-settings/business-settings.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      introspection: process.env.NODE_ENV !== 'production',
      graphiql: false,
      playground: false,
      plugins:
        process.env.NODE_ENV !== 'production'
          ? [
              ApolloServerPluginLandingPageLocalDefault({
                embed: true,
                document: `# Consultas publicas listas para probar
# En GraphQL no hay endpoints separados como en Swagger: todo se prueba en /graphql.

query ProductsExample {
  products(input: { pagination: { page: 1, limit: 10 } }) {
    items {
      id
      sku
      slug
      name
      thumbnail
      price
      stock
      availability
      variants {
        name
        stock
        price
      }
    }
    total
    page
    totalPages
  }
}

query CategoriesExample {
  categories {
    id
    name
    slug
    parentId
  }
}

query BannersExample {
  banners {
    id
    title
    imageUrl
    subtitle
    linkUrl
    ctaLabel
    order
    isActive
  }
}

mutation LoginExample {
  login(input: { username: "TU_USUARIO", password: "TU_PASSWORD" }) {
    access_token
    refresh_token
    user {
      id
      username
      email
      role
    }
  }
}

# Para consultas privadas, pega el token en Headers:
# { "Authorization": "Bearer TU_ACCESS_TOKEN" }
query MeExample {
  me {
    id
    username
    email
    role
  }
}`,
              }),
            ]
          : [],
      validationRules: [graphQLSecurityRule],
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      // Exporta el esquema a un archivo SDL para documentación/versionado
      autoSchemaFile: 'docs/schema.graphql',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Siempre usa el mismo archivo .env
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          process.env.NODE_ENV === 'test'
            ? configService.get<string>('TEST_DB_URI')
            : configService.get<string>('MONGO_URI'),
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.THROTTLE_TTL_SECONDS) || 60,
          limit: Number(process.env.THROTTLE_LIMIT) || 10,
        },
      ],
    }),
    AuthModule,
    AuditModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
    FavoritesModule,
    BannersModule,
    BusinessSettingsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GraphqlTracingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
