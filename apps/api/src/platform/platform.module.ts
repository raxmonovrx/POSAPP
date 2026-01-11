import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignOptions } from 'jsonwebtoken';
import { BootstrapModule } from '../bootstrap/bootstrap.module';
import { DeviceEntity } from '../entities/device.entity';
import { DeviceResetAuditEntity } from '../entities/device-reset-audit.entity';
import { PlatformAdminEntity } from '../entities/platform-admin.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { PlatformAuditController } from './platform-audit.controller';
import { PlatformAuditService } from './platform-audit.service';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAuthGuard } from './platform-auth.guard';
import { PlatformDevicesController } from './platform-devices.controller';
import { PlatformDevicesService } from './platform-devices.service';
import { PlatformJwtStrategy } from './platform-jwt.strategy';
import { PlatformSeedService } from './platform-seed.service';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([
      PlatformAdminEntity,
      TenantEntity,
      DeviceEntity,
      StoreEntity,
      UserEntity,
      DeviceResetAuditEntity,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('PLATFORM_JWT_SECRET', { infer: true }) ??
          config.get<string>('JWT_ACCESS_SECRET', { infer: true }) ??
          '';
        const expiresIn = config.get<string>('PLATFORM_JWT_TTL', '1d', {
          infer: true,
        }) as SignOptions['expiresIn'];

        if (!secret) throw new Error('Platform JWT secret is not configured');

        return { secret, signOptions: { expiresIn } };
      },
    }),
    BootstrapModule,
  ],
  controllers: [
    PlatformAuthController,
    PlatformTenantsController,
    PlatformDevicesController,
    PlatformAuditController,
  ],
  providers: [
    PlatformAuthService,
    PlatformTenantsService,
    PlatformDevicesService,
    PlatformAuditService,
    PlatformJwtStrategy,
    PlatformAuthGuard,
    PlatformSeedService,
  ],
})
export class PlatformModule {}
