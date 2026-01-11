import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  JWT_DEVICE_SECRET: z.string().optional(),
  JWT_DEVICE_TTL: z.string().default('30d'),

  PLATFORM_JWT_SECRET: z.string().optional(),
  PLATFORM_JWT_TTL: z.string().default('1d'),
  PLATFORM_SEED_ADMIN_EMAIL: z.string().optional(),
  PLATFORM_SEED_ADMIN_PASSWORD: z.string().optional(),

  DB_LOGGING: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true')
    .default('false' as any),

  DB_SYNCHRONIZE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true')
    .default('false' as any),
});

export type Env = z.infer<typeof envSchema>;
