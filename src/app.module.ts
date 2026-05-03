import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validate } from './config/env.validation.js';

import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { AuditModule } from './modules/audit/audit.module.js';

import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    HealthModule,
    SessionsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ── APP_GUARD: ThrottlerGuard global ─────────────
    // Documentado en implementation_plan.md
    // Rate limiting: 100 req/min por defecto, configurable via env
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ── APP_INTERCEPTOR: TransformResponseInterceptor ─
    // Documentado en implementation_plan.md
    // Envuelve respuestas exitosas en { success, data, meta }
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
