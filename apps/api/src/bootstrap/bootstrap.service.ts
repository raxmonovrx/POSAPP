import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class BootstrapService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(StoreEntity)
    private readonly stores: Repository<StoreEntity>,
    @InjectRepository(DeviceEntity)
    private readonly devices: Repository<DeviceEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async bootstrap(input: {
    tenantName: string;
    storeName: string;
    ownerEmail: string;
    ownerPassword: string;
    deviceCode: string;
    maxDevices?: number;
  }) {
    const tenantName = input.tenantName.trim();
    const storeName = input.storeName.trim();
    const ownerEmail = input.ownerEmail.toLowerCase().trim();
    const ownerPassword = input.ownerPassword;
    const deviceCode = input.deviceCode.trim().toUpperCase();
    const maxDevices = input.maxDevices ?? 1;

    if (
      !tenantName ||
      !storeName ||
      !ownerEmail ||
      !ownerPassword ||
      !deviceCode
    ) {
      throw new BadRequestException('Missing fields');
    }

    if (maxDevices < 1)
      throw new BadRequestException('maxDevices must be at least 1');

    const existingTenant = await this.tenants.findOne({
      where: { name: tenantName },
    });
    if (existingTenant)
      throw new BadRequestException('Tenant name already exists');

    const existingOwner = await this.users.findOne({
      where: { email: ownerEmail },
    });
    if (existingOwner)
      throw new BadRequestException(
        'Owner email is already used by another account',
      );

    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    const deviceKey = randomBytes(24).toString('hex');
    const deviceKeyHash = createHash('sha256').update(deviceKey).digest('hex');

    return this.dataSource.transaction(async (manager) => {
      const tenantRepo = manager.getRepository(TenantEntity);
      const storeRepo = manager.getRepository(StoreEntity);
      const userRepo = manager.getRepository(UserEntity);
      const deviceRepo = manager.getRepository(DeviceEntity);

      const tenant = await tenantRepo.save({
        name: tenantName,
        isActive: true,
        maxDevices,
      });

      const store = await storeRepo.save({
        tenantId: tenant.id,
        name: storeName,
        isActive: true,
      });

      const owner = await userRepo.save({
        tenantId: tenant.id,
        email: ownerEmail,
        passwordHash,
        role: 'owner',
        isActive: true,
      });

      const device = await deviceRepo.save({
        tenantId: tenant.id,
        storeId: store.id,
        deviceCode,
        deviceKeyHash,
        isActive: true,
      });

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          maxDevices: tenant.maxDevices,
        },
        store: { id: store.id, name: store.name },
        owner: { id: owner.id, email: owner.email, role: owner.role },
        device: {
          id: device.id,
          deviceCode: device.deviceCode,
          deviceKey,
        },
      };
    });
  }
}
