import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantService } from './tenant.service';

@ApiTags('Tenant')
@ApiBearerAuth('tenantAuth')
@UseGuards(JwtAuthGuard)
@Controller()
export class TenantController {
  constructor(private readonly tenantSvc: TenantService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    return this.tenantSvc.getMe((req.user as any).sub);
  }

  @Get('tenant/summary')
  getSummary(@Req() req: Request) {
    const user = req.user as any;
    return this.tenantSvc.getSummary(user);
  }
}
