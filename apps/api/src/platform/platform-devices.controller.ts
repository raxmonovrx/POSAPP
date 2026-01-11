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
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { PlatformAuthGuard } from './platform-auth.guard';
import { PatchPlatformDeviceStatusDto } from './dto/patch-platform-device-status.dto';
import { ResetDeviceKeyDto } from './dto/reset-device-key.dto';
import { PlatformDevicesService } from './platform-devices.service';

@ApiTags('PlatformDevices')
@ApiBearerAuth('platformAuth')
@UseGuards(PlatformAuthGuard)
@Controller('platform/devices')
export class PlatformDevicesController {
  constructor(private readonly devices: PlatformDevicesService) {}

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.devices.get(id);
  }

  @Patch(':id/status')
  @ApiBody({ type: PatchPlatformDeviceStatusDto })
  patchStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchPlatformDeviceStatusDto,
  ) {
    return this.devices.patchStatus(id, dto.isActive);
  }

  @Post(':id/reset-key')
  @ApiBody({ type: ResetDeviceKeyDto, description: 'Optional reason for audit log' })
  resetKey(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResetDeviceKeyDto,
  ) {
    const admin = req.user as any;
    return this.devices.resetKey(id, admin.sub, dto.reason);
  }
}
