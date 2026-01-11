import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/device.entity';
import { DeviceResetAuditEntity } from '../entities/device-reset-audit.entity';

@Injectable()
export class PlatformDevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devices: Repository<DeviceEntity>,
    @InjectRepository(DeviceResetAuditEntity)
    private readonly audits: Repository<DeviceResetAuditEntity>,
  ) {}

  async get(deviceId: string) {
    const device = await this.devices.findOne({
      where: { id: deviceId },
      relations: ['tenant', 'store'],
    });
    if (!device) throw new NotFoundException('Device not found');
    return {
      id: device.id,
      tenantId: device.tenantId,
      storeId: device.storeId,
      deviceCode: device.deviceCode,
      isActive: device.isActive,
      tokenVersion: device.tokenVersion,
      lastResetAt: device.lastResetAt,
      lastSeenAt: device.lastSeenAt,
      tenant: device.tenant
        ? { id: device.tenant.id, name: device.tenant.name, isActive: device.tenant.isActive }
        : null,
      store: device.store
        ? { id: device.store.id, name: device.store.name, isActive: device.store.isActive }
        : null,
    };
  }

  async patchStatus(deviceId: string, isActive: boolean) {
    const device = await this.devices.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');
    device.isActive = isActive;
    await this.devices.save(device);
    return { id: device.id, isActive: device.isActive };
  }

  async resetKey(deviceId: string, platformAdminId: string, reason?: string) {
    const device = await this.devices.findOne({
      where: { id: deviceId },
      relations: ['tenant', 'store'],
    });

    if (!device) throw new NotFoundException('Device not found');
    if (!device.tenant?.isActive)
      throw new BadRequestException('Tenant is inactive');
    if (!device.store?.isActive)
      throw new BadRequestException('Store is inactive');

    const newKey = randomBytes(24).toString('hex');
    const newHash = createHash('sha256').update(newKey).digest('hex');

    const updated = await this.devices.save({
      id: device.id,
      deviceKeyHash: newHash,
      tokenVersion: device.tokenVersion + 1,
      lastResetAt: new Date(),
    });

    await this.audits.save({
      deviceId: device.id,
      tenantId: device.tenantId,
      platformAdminId,
      reason,
    });

    return {
      device: {
        id: updated.id,
        tenantId: updated.tenantId,
        storeId: updated.storeId,
        deviceCode: updated.deviceCode,
        tokenVersion: updated.tokenVersion,
      },
      deviceKey: newKey,
    };
  }
}
