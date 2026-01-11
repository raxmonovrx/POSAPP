import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const makeTypeOrmOptions = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('DB_HOST', { infer: true }),
  port: config.get<number>('DB_PORT', { infer: true }),
  database: config.get<string>('DB_NAME', { infer: true }),
  username: config.get<string>('DB_USER', { infer: true }),
  password: config.get<string>('DB_PASSWORD', { infer: true }),

  autoLoadEntities: true,
  synchronize: config.get<boolean>('DB_SYNCHRONIZE', false, { infer: true }),
  logging: config.get<boolean>('DB_LOGGING', false, { infer: true }),

  charset: 'utf8mb4',
});
