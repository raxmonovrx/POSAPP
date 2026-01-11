import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { PatchTenantUserPasswordDto } from './dto/patch-tenant-user-password.dto';
import { PatchTenantUserRoleDto } from './dto/patch-tenant-user-role.dto';
import { PatchTenantUserStatusDto } from './dto/patch-tenant-user-status.dto';
import { TenantUsersService } from './tenant-users.service';

@ApiTags('Users')
@ApiBearerAuth('tenantAuth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class TenantUsersController {
  constructor(private readonly users: TenantUsersService) {}

  @Get()
  list(@Req() req: Request) {
    return this.users.list(req.user as any);
  }

  @Post()
  @ApiBody({ type: CreateTenantUserDto })
  create(@Req() req: Request, @Body() dto: CreateTenantUserDto) {
    return this.users.create(req.user as any, dto);
  }

  @Patch(':id/status')
  patchStatus(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchTenantUserStatusDto,
  ) {
    return this.users.patchStatus(req.user as any, id, dto.isActive);
  }

  @Patch(':id/role')
  patchRole(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchTenantUserRoleDto,
  ) {
    return this.users.patchRole(req.user as any, id, dto.role);
  }

  @Patch(':id/password')
  patchPassword(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchTenantUserPasswordDto,
  ) {
    return this.users.patchPassword(req.user as any, id, dto.newPassword);
  }
}
