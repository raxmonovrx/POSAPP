import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { TenantStoresController } from './tenant-stores.controller';
import { TenantUsersController } from '../tenant-users/tenant-users.controller';
import { TenantUsersService } from '../tenant-users/tenant-users.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      TenantEntity,
      StoreEntity,
      DeviceEntity,
      UserEntity,
    ]),
  ],
  controllers: [TenantController, TenantStoresController, TenantUsersController],
  providers: [TenantService, TenantUsersService],
  exports: [TenantService, TenantUsersService],
})
export class TenantModule {}
