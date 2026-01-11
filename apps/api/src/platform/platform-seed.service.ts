import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PlatformAdminEntity } from '../entities/platform-admin.entity';

@Injectable()
export class PlatformSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(PlatformAdminEntity)
    private readonly admins: Repository<PlatformAdminEntity>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const seedEmail = this.config.get<string>('PLATFORM_SEED_ADMIN_EMAIL', {
      infer: true,
    });
    const seedPassword = this.config.get<string>(
      'PLATFORM_SEED_ADMIN_PASSWORD',
      { infer: true },
    );

    if (!seedEmail || !seedPassword) return;

    const normalizedEmail = seedEmail.toLowerCase().trim();
    const exists = await this.admins.findOne({
      where: { email: normalizedEmail },
    });
    if (exists) return;

    const passwordHash = await bcrypt.hash(seedPassword, 10);
    await this.admins.save({
      email: normalizedEmail,
      passwordHash,
      isActive: true,
    });
  }
}
