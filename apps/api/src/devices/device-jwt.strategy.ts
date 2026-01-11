import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../entities/device.entity';

@Injectable()
export class DeviceJwtStrategy extends PassportStrategy(Strategy, 'device-jwt') {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly devices: Repository<DeviceEntity>,
    private readonly config: ConfigService,
  ) {
    const secret =
      config.get<string>('JWT_DEVICE_SECRET', { infer: true }) ??
      config.get<string>('JWT_ACCESS_SECRET', { infer: true }) ??
      '';
    if (!secret) throw new Error('Device JWT secret is not configured');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (payload?.tokenType !== 'device' || !payload?.sub)
      throw new UnauthorizedException('Invalid token');

    const device = await this.devices.findOne({
      where: { id: payload.sub },
      relations: ['tenant', 'store'],
    });

    if (!device) throw new UnauthorizedException('Device not found');
    if (!device.isActive) throw new UnauthorizedException('Device inactive');
    if (!device.tenant?.isActive)
      throw new UnauthorizedException('Tenant inactive');
    if (!device.store?.isActive)
      throw new UnauthorizedException('Store inactive');
    if (payload.tokenVersion !== device.tokenVersion)
      throw new UnauthorizedException('Token revoked');

    return {
      deviceId: device.id,
      tenantId: device.tenantId,
      storeId: device.storeId,
      tokenVersion: device.tokenVersion,
    };
  }
}
