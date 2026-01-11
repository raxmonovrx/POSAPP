import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { envSchema } from './config/env';
import { makeTypeOrmOptions } from './config/typeorm.config';
import { DevicesModule } from './devices/devices.module';
import { PlatformModule } from './platform/platform.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (raw) => envSchema.parse(raw),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => makeTypeOrmOptions(config),
    }),

    AuthModule,
    BootstrapModule,
    DevicesModule,
    PlatformModule,
    TenantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
