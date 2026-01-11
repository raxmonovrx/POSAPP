import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BootstrapService } from '../bootstrap/bootstrap.service';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { CreatePlatformTenantDto } from './dto/create-platform-tenant.dto';
import { ListPlatformTenantsDto } from './dto/list-platform-tenants.dto';

@Injectable()
export class PlatformTenantsService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(DeviceEntity)
    private readonly devices: Repository<DeviceEntity>,
    @InjectRepository(StoreEntity)
    private readonly stores: Repository<StoreEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly bootstrap: BootstrapService,
  ) {}

  async createTenant(dto: CreatePlatformTenantDto) {
    return this.bootstrap.bootstrap({
      tenantName: dto.tenantName,
      storeName: dto.storeName,
      ownerEmail: dto.ownerEmail,
      ownerPassword: dto.ownerPassword,
      deviceCode: dto.deviceCode,
      maxDevices: dto.maxDevices ?? 1,
    });
  }

  async listTenants(query: ListPlatformTenantsDto) {
    const qb = this.tenants
      .createQueryBuilder('t')
      .orderBy('t.createdAt', 'DESC');
    if (query.q) {
      qb.where('t.name LIKE :q', { q: `%${query.q}%` });
    }
    const items = await qb.getMany();
    return {
      items: items.map((t) => ({
        id: t.id,
        name: t.name,
        isActive: t.isActive,
        maxDevices: t.maxDevices,
      })),
    };
  }

  async getTenant(id: string) {
    const tenant = await this.tenants.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const store = await this.stores.findOne({
      where: { tenantId: tenant.id },
      order: { createdAt: 'ASC' },
    });
    const activeDevices = await this.devices.count({
      where: { tenantId: tenant.id, isActive: true },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive,
      maxDevices: tenant.maxDevices,
      activeDevices,
      store: store
        ? { id: store.id, name: store.name, isActive: store.isActive }
        : null,
    };
  }

  async updateMaxDevices(tenantId: string, maxDevices: number) {
    if (maxDevices < 1)
      throw new BadRequestException('maxDevices must be at least 1');

    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const activeDevices = await this.devices.count({
      where: { tenantId, isActive: true },
    });

    if (maxDevices < activeDevices)
      throw new BadRequestException(
        'maxDevices cannot be lower than active device count',
      );

    tenant.maxDevices = maxDevices;
    await this.tenants.save(tenant);

    return {
      id: tenant.id,
      name: tenant.name,
      maxDevices: tenant.maxDevices,
      activeDevices,
    };
  }

  async updateStatus(tenantId: string, isActive: boolean) {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    tenant.isActive = isActive;
    await this.tenants.save(tenant);
    return { id: tenant.id, isActive: tenant.isActive };
  }

  async getTenantDevices(tenantId: string) {
    const devices = await this.devices.find({
      where: { tenantId },
      relations: ['store'],
      order: { createdAt: 'ASC' },
    });
    return {
      items: devices.map((d) => ({
        id: d.id,
        deviceCode: d.deviceCode,
        isActive: d.isActive,
        tokenVersion: d.tokenVersion,
        lastResetAt: d.lastResetAt,
        lastSeenAt: d.lastSeenAt,
        store: d.store
          ? { id: d.store.id, name: d.store.name, isActive: d.store.isActive }
          : null,
      })),
    };
  }

  async getTenantUsers(tenantId: string) {
    const users = await this.users.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    };
  }

  async getTenantStores(tenantId: string) {
    const stores = await this.stores.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return {
      items: stores.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        address: s.address,
      })),
    };
  }
}
