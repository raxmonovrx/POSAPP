import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceResetAuditEntity } from '../entities/device-reset-audit.entity';
import { ListDeviceResetAuditsDto } from './dto/list-device-reset-audits.dto';

@Injectable()
export class PlatformAuditService {
  constructor(
    @InjectRepository(DeviceResetAuditEntity)
    private readonly audits: Repository<DeviceResetAuditEntity>,
  ) {}

  async listDeviceResets(query: ListDeviceResetAuditsDto) {
    const qb = this.audits
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC');

    if (query.tenantId) qb.andWhere('a.tenantId = :tenantId', { tenantId: query.tenantId });
    if (query.deviceId) qb.andWhere('a.deviceId = :deviceId', { deviceId: query.deviceId });

    const items = await qb.getMany();
    return {
      items: items.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        deviceId: a.deviceId,
        platformAdminId: a.platformAdminId,
        reason: a.reason,
        createdAt: a.createdAt,
      })),
    };
  }
}
