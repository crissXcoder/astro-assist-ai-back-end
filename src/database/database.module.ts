import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev =
          configService.get<string>('NODE_ENV', 'development') ===
          'development';

        return {
          type: 'mysql' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 3306),
          username: configService.get<string>('DB_USERNAME', 'root'),
          password: configService.get<string>('DB_PASSWORD', ''),
          database: configService.get<string>('DB_DATABASE', 'astroassist_db'),
          autoLoadEntities: true,
          // ── Desarrollo: recrea DB en cada reinicio ──────────
          // Producción: SIEMPRE false. Usar migraciones explícitas.
          synchronize: isDev,
          dropSchema: isDev,
          // ── Logging condicional ─────────────────────────────
          logging: isDev ? true : (['error', 'warn', 'migration'] as const),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
