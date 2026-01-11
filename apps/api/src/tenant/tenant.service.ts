import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(StoreEntity)
    private readonly stores: Repository<StoreEntity>,
    @InjectRepository(DeviceEntity)
    private readonly devices: Repository<DeviceEntity>,
  ) {}

  async getMe(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['tenant'],
    });
    if (!user) throw new NotFoundException('User not found');

    const store = await this.stores.findOne({
      where: { tenantId: user.tenantId },
      order: { createdAt: 'ASC' },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        isActive: user.tenant.isActive,
      },
      store: store
        ? { id: store.id, name: store.name, isActive: store.isActive }
        : null,
    };
  }

  async getSummary(user: { tenantId: string; role: string }) {
    if (!['owner', 'admin'].includes(user.role))
      throw new ForbiddenException('Only owner/admin can view summary');

    const tenant = await this.tenants.findOne({
      where: { id: user.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const store = await this.stores.findOne({
      where: { tenantId: user.tenantId },
      order: { createdAt: 'ASC' },
    });

    const activeDevices = await this.devices.count({
      where: { tenantId: user.tenantId, isActive: true },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        isActive: tenant.isActive,
        maxDevices: tenant.maxDevices,
      },
      activeDevices,
      store: store
        ? { id: store.id, name: store.name, isActive: store.isActive }
        : null,
    };
  }
}
