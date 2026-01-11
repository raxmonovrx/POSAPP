import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { SignOptions } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/device.entity';
import { StoreEntity } from '../entities/store.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ActivateDeviceDto } from './dto/activate-device.dto';
import { ListDevicesQueryDto } from './dto/list-devices.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devices: Repository<DeviceEntity>,
    @InjectRepository(StoreEntity)
    private readonly stores: Repository<StoreEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private getDeviceSigningConfig() {
    const secret =
      this.config.get<string>('JWT_DEVICE_SECRET', { infer: true }) ??
      this.config.get<string>('JWT_ACCESS_SECRET', { infer: true }) ??
      '';
    const expiresIn = this.config.get<string>('JWT_DEVICE_TTL', '30d', {
      infer: true,
    }) as SignOptions['expiresIn'];

    if (!secret) {
      throw new Error('Device JWT secret is not configured');
    }

    return { secret, expiresIn };
  }

  private hashKey(deviceKey: string) {
    return createHash('sha256').update(deviceKey).digest('hex');
  }

  async createDevice(
    user: { tenantId: string; role: string },
    dto: CreateDeviceDto,
  ) {
    if (!['owner', 'admin'].includes(user.role))
      throw new ForbiddenException('Only owner/admin can create devices');

    const tenant = await this.tenants.findOne({
      where: { id: user.tenantId },
    });
    if (!tenant || !tenant.isActive)
      throw new BadRequestException('Tenant is inactive or missing');

    const normalizedCode = dto.deviceCode.trim().toUpperCase();
    const activeCount = await this.devices.count({
      where: { tenantId: user.tenantId, isActive: true },
    });

    if (activeCount >= tenant.maxDevices)
      throw new BadRequestException('Device limit reached');

    const store =
      (dto.storeId &&
        (await this.stores.findOne({
          where: {
            id: dto.storeId,
            tenantId: user.tenantId,
            isActive: true,
          },
        }))) ||
      (await this.stores.findOne({
        where: { tenantId: user.tenantId, isActive: true },
        order: { createdAt: 'ASC' },
      }));

    if (!store)
      throw new BadRequestException('Active store was not found for tenant');

    const existingCode = await this.devices.findOne({
      where: { tenantId: user.tenantId, deviceCode: normalizedCode },
    });
    if (existingCode)
      throw new BadRequestException('Device code already exists');

    const deviceKey = randomBytes(24).toString('hex');
    const deviceKeyHash = this.hashKey(deviceKey);

    const device = await this.devices.save({
      tenantId: user.tenantId,
      storeId: store.id,
      deviceCode: normalizedCode,
      deviceKeyHash,
      isActive: true,
    });

    return {
      device: {
        id: device.id,
        tenantId: device.tenantId,
        storeId: device.storeId,
        deviceCode: device.deviceCode,
        tokenVersion: device.tokenVersion,
      },
      deviceKey,
      currentDevices: activeCount + 1,
      maxDevices: tenant.maxDevices,
    };
  }

  async activate(dto: ActivateDeviceDto) {
    const deviceKey = dto.deviceKey.trim();
    const deviceKeyHash = this.hashKey(deviceKey);
    const device = await this.devices.findOne({
      where: { deviceKeyHash },
      relations: ['tenant', 'store'],
    });

    if (!device)
      throw new UnauthorizedException('Invalid or unknown device key');

    if (!device.isActive)
      throw new UnauthorizedException('Device is disabled or inactive');

    if (!device.tenant?.isActive)
      throw new UnauthorizedException('Tenant is inactive');

    if (!device.store?.isActive)
      throw new UnauthorizedException('Store is inactive');

    const newKey = randomBytes(24).toString('hex');
    const newHash = this.hashKey(newKey);
    await this.devices.update(device.id, {
      deviceKeyHash: newHash,
      lastSeenAt: new Date(),
    });

    const { secret, expiresIn } = this.getDeviceSigningConfig();
    const deviceToken = await this.jwt.signAsync(
      {
        sub: device.id,
        tenantId: device.tenantId,
        storeId: device.storeId,
        tokenType: 'device',
        tokenVersion: device.tokenVersion,
      },
      { secret, expiresIn },
    );

    return {
      deviceToken,
      device: {
        id: device.id,
        tenantId: device.tenantId,
        storeId: device.storeId,
        deviceCode: device.deviceCode,
        tokenVersion: device.tokenVersion,
      },
    };
  }

  async listDevices(user: { tenantId: string; role: string }, query: ListDevicesQueryDto) {
    if (!['owner', 'admin'].includes(user.role))
      throw new ForbiddenException('Only owner/admin can list devices');

    const qb = this.devices
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId: user.tenantId })
      .orderBy('d.createdAt', 'ASC');

    if (query.isActive !== undefined) {
      qb.andWhere('d.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.q) {
      qb.andWhere('d.deviceCode LIKE :q', { q: `%${query.q}%` });
    }

    const items = await qb.getMany();
    return {
      items: items.map((d) => ({
        id: d.id,
        tenantId: d.tenantId,
        storeId: d.storeId,
        deviceCode: d.deviceCode,
        isActive: d.isActive,
        tokenVersion: d.tokenVersion,
        lastResetAt: d.lastResetAt,
        lastSeenAt: d.lastSeenAt,
      })),
    };
  }

  async getDevice(user: { tenantId: string; role: string }, id: string) {
    if (!['owner', 'admin'].includes(user.role))
      throw new ForbiddenException('Only owner/admin can view devices');

    const device = await this.devices.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['store'],
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
      store: device.store
        ? { id: device.store.id, name: device.store.name, isActive: device.store.isActive }
        : null,
    };
  }

  async updateStatus(
    user: { tenantId: string; role: string },
    id: string,
    isActive: boolean,
  ) {
    if (!['owner', 'admin'].includes(user.role))
      throw new ForbiddenException('Only owner/admin can update devices');

    const device = await this.devices.findOne({
      where: { id, tenantId: user.tenantId },
    });
    if (!device) throw new NotFoundException('Device not found');

    device.isActive = isActive;
    await this.devices.save(device);

    return { id: device.id, isActive: device.isActive };
  }
}
