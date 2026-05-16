import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';
import { CategoriesSeed } from './modules/categories/categories.seed';

// Swagger

const parseCorsOrigins = (value?: string): string | string[] | undefined => {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!origins?.length) return undefined;
  return origins.length === 1 ? origins[0] : origins;
};

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.printf((info: Record<string, unknown>) => {
        const ts = typeof info.timestamp === 'string' ? info.timestamp : '';
        const lvl = typeof info.level === 'string' ? info.level : 'info';
        const ctxRaw = info.context;
        const msgRaw = info.message;
        const ctx =
          typeof ctxRaw === 'string' && ctxRaw.length > 0
            ? ctxRaw
            : 'Application';
        const msg =
          typeof msgRaw === 'string' ? msgRaw : JSON.stringify(msgRaw);
        return `[${ts}] [${lvl}] [${ctx}] ${msg}`;
      }),
    ),
    transports: [
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '10m',
        maxFiles: '7d',
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.json(),
        ),
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.colorize(),
          winston.format.printf((info: Record<string, unknown>) => {
            const ts = typeof info.timestamp === 'string' ? info.timestamp : '';
            const lvl = typeof info.level === 'string' ? info.level : 'info';
            const ctxRaw = info.context;
            const msgRaw = info.message;
            const ctx =
              typeof ctxRaw === 'string' && ctxRaw.length > 0
                ? ctxRaw
                : 'Application';
            const msg =
              typeof msgRaw === 'string' ? msgRaw : JSON.stringify(msgRaw);
            return `[${ts}] [${lvl}] [${ctx}] ${msg}`;
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: parseCorsOrigins(configService.get<string>('CORS_ORIGIN')),
    methods: 'POST,OPTIONS',
    credentials: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  const port = Number(process.env.PORT) || 3001;

  const categoriesSeed = app.get(CategoriesSeed);
  await categoriesSeed.seed();

  await app.listen(port);
  logger.log(`Servidor escuchando en el puerto ${String(port)}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error('Fatal error during bootstrap', err);
});
