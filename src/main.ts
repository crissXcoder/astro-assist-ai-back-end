import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Environment } from './config/env.validation.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const nodeEnv =
    configService.get<string>('NODE_ENV') ?? Environment.Development;
  const isProduction = nodeEnv === (Environment.Production as string);

  // ── Global Prefix ───────────────────────────────────
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix, {
    exclude: [], // Todas las rutas usan el prefix
  });

  // ── Security Headers (Helmet) ───────────────────────
  // Ajustar CSP para Swagger en desarrollo
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? undefined // Defaults estrictos de Helmet en producción
        : false, // Deshabilitar CSP en dev para Swagger UI
      crossOriginEmbedderPolicy: isProduction,
    }),
  );

  // ── Cookie Parser ───────────────────────────────────
  app.use(cookieParser());

  // ── CORS Cerrado ────────────────────────────────────
  // Leer CORS_ALLOWED_ORIGINS (comma-separated), nunca wildcard con credentials
  const corsOriginsRaw = configService.get<string>(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173',
  );
  const allowedOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept'],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
  });

  // ── Global Validation Pipe ──────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Exception Filter ─────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger (solo en desarrollo) ────────────────────
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AstroAssist AI Backend')
      .setDescription('The AstroAssist AI API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    logger.log(`Swagger disponible en /${apiPrefix}/docs`);
  }

  // ── Start ───────────────────────────────────────────
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(
    `AstroAssist API corriendo en puerto ${String(port)} [${nodeEnv}]`,
  );
  logger.log(`CORS habilitado para: ${allowedOrigins.join(', ')}`);
}
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Error fatal al iniciar la aplicación: ${message}`);
  process.exit(1);
});
