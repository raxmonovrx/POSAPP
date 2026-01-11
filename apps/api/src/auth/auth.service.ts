import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersRepo.findOne({
      where: { email: normalizedEmail },
      relations: ['tenant'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('User is inactive');
    if (!user.tenant?.isActive)
      throw new UnauthorizedException('Tenant is inactive');

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      tokenType: 'tenantUser',
    };

    await this.usersRepo.update(user.id, { lastLoginAt: new Date() });

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
