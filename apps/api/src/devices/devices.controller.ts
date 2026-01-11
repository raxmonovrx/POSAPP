import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivateDeviceDto } from './dto/activate-device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ListDevicesQueryDto } from './dto/list-devices.dto';
import { PatchDeviceStatusDto } from './dto/patch-device-status.dto';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('tenantAuth')
  @ApiBody({ type: CreateDeviceDto })
  create(@Req() req: Request, @Body() dto: CreateDeviceDto) {
    return this.devices.createDevice(req.user as any, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth('tenantAuth')
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  list(@Req() req: Request, @Query() query: ListDevicesQueryDto) {
    return this.devices.listDevices(req.user as any, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('tenantAuth')
  getOne(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.devices.getDevice(req.user as any, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiBearerAuth('tenantAuth')
  @ApiBody({ type: PatchDeviceStatusDto })
  patchStatus(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchDeviceStatusDto,
  ) {
    return this.devices.updateStatus(req.user as any, id, dto.isActive);
  }

  @Post('activate')
  @ApiBody({ type: ActivateDeviceDto })
  activate(@Body() dto: ActivateDeviceDto) {
    return this.devices.activate(dto);
  }
}
