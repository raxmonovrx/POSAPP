import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PlatformAdminEntity } from '../entities/platform-admin.entity';

@Injectable()
export class PlatformAuthService {
  constructor(
    @InjectRepository(PlatformAdminEntity)
    private readonly admins: Repository<PlatformAdminEntity>,
    private readonly jwt: JwtService,
  ) {}

  private async validate(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const admin = await this.admins.findOne({
      where: { email: normalizedEmail },
    });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    if (!admin.isActive)
      throw new UnauthorizedException('Admin is inactive or blocked');

    return admin;
  }

  async login(email: string, password: string) {
    const admin = await this.validate(email, password);
    const payload = {
      sub: admin.id,
      role: 'platformAdmin',
      tokenType: 'platformAdmin',
    };

    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      admin: { id: admin.id, email: admin.email },
    };
  }
}
