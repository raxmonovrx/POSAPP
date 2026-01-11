import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TenantUsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async list(actor: { tenantId: string; role: string }) {
    if (!['owner', 'admin'].includes(actor.role))
      throw new ForbiddenException('Only owner/admin can list users');

    const items = await this.users.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'ASC' },
    });

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    };
  }

  async create(
    actor: { tenantId: string; role: string },
    input: { email: string; password: string; role: 'admin' | 'cashier' },
  ) {
    if (!['owner', 'admin'].includes(actor.role))
      throw new ForbiddenException('Only owner/admin can create users');

    const email = input.email.toLowerCase().trim();
    const exists = await this.users.findOne({
      where: { tenantId: actor.tenantId, email },
    });
    if (exists) throw new BadRequestException('Email already exists');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.save({
      tenantId: actor.tenantId,
      email,
      passwordHash,
      role: input.role,
      isActive: true,
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  private async ensureTarget(actor: { tenantId: string }, userId: string) {
    const user = await this.users.findOne({
      where: { id: userId, tenantId: actor.tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async patchStatus(
    actor: { tenantId: string; role: string },
    userId: string,
    isActive: boolean,
  ) {
    if (!['owner', 'admin'].includes(actor.role))
      throw new ForbiddenException('Only owner/admin can update user status');

    const user = await this.ensureTarget(actor, userId);
    if (user.role === 'owner')
      throw new BadRequestException('Owner status cannot be changed here');

    user.isActive = isActive;
    await this.users.save(user);
    return { id: user.id, isActive: user.isActive };
  }

  async patchRole(
    actor: { tenantId: string; role: string },
    userId: string,
    role: 'admin' | 'cashier',
  ) {
    if (actor.role !== 'owner')
      throw new ForbiddenException('Only owner can change roles');

    const user = await this.ensureTarget(actor, userId);
    if (user.role === 'owner')
      throw new BadRequestException('Owner role cannot be changed');

    user.role = role;
    await this.users.save(user);
    return { id: user.id, role: user.role };
  }

  async patchPassword(
    actor: { tenantId: string; role: string },
    userId: string,
    newPassword: string,
  ) {
    if (!['owner', 'admin'].includes(actor.role))
      throw new ForbiddenException('Only owner/admin can reset password');

    const user = await this.ensureTarget(actor, userId);
    if (!user.isActive)
      throw new BadRequestException('Cannot update inactive user');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.update(user.id, { passwordHash });
    return { id: user.id };
  }
}
