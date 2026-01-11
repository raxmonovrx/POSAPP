import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreEntity } from '../entities/store.entity';

@ApiTags('Stores')
@ApiBearerAuth('tenantAuth')
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class TenantStoresController {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly stores: Repository<StoreEntity>,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const user = req.user as any;
    const stores = await this.stores.find({
      where: { tenantId: user.tenantId },
      order: { createdAt: 'ASC' },
    });
    return {
      items: stores.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        tenantId: s.tenantId,
        address: s.address,
      })),
    };
  }

  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const user = req.user as any;
    const store = await this.stores.findOne({
      where: { id, tenantId: user.tenantId },
    });
    if (!store) throw new NotFoundException('Store not found');

    return {
      id: store.id,
      name: store.name,
      isActive: store.isActive,
      tenantId: store.tenantId,
      address: store.address,
    };
  }
}
