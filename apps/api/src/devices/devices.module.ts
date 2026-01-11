import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignOptions } from 'jsonwebtoken';
import { AuthModule } from '../auth/auth.module';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { DeviceAuthGuard } from './device-auth.guard';
import { DeviceJwtStrategy } from './device-jwt.strategy';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([DeviceEntity, StoreEntity, TenantEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('JWT_DEVICE_SECRET', { infer: true }) ??
          config.get<string>('JWT_ACCESS_SECRET', { infer: true }) ??
          '';
        const expiresIn = config.get<string>('JWT_DEVICE_TTL', '30d', {
          infer: true,
        }) as SignOptions['expiresIn'];

        if (!secret) throw new Error('Device JWT secret is not configured');

        return { secret, signOptions: { expiresIn } };
      },
    }),
  ],
  controllers: [DevicesController],
  providers: [DevicesService, DeviceJwtStrategy, DeviceAuthGuard],
  exports: [DeviceAuthGuard],
})
export class DevicesModule {}
