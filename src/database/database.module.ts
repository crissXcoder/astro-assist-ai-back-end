import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Session } from '../modules/auth/entities/session.entity.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // ... (useFactory content remains the same)
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
          synchronize: isDev,
          dropSchema: isDev,
          logging: isDev ? true : (['error', 'warn', 'migration'] as const),
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
