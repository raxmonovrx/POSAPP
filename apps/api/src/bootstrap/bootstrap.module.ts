import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      StoreEntity,
      DeviceEntity,
      UserEntity,
    ]),
  ],
  controllers: [BootstrapController],
  providers: [BootstrapService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
