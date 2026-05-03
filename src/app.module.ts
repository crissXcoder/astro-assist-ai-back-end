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
import { AdminModule } from './modules/admin/admin.module.js';

import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';

import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';

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
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ── APP_GUARD: ThrottlerGuard global ─────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ── APP_GUARD: JwtAuthGuard global ───────────────
    // Protege todos los endpoints por defecto. Usar @Public() para omitir.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // ── APP_GUARD: RolesGuard global ────────────────
    // Valida roles si el decorador @Roles() está presente.
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // ── APP_INTERCEPTOR: TransformResponseInterceptor ─
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
