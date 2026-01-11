import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CreatePlatformTenantDto } from './dto/create-platform-tenant.dto';
import { ListPlatformTenantsDto } from './dto/list-platform-tenants.dto';
import { UpdateMaxDevicesDto } from './dto/update-max-devices.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { PlatformAuthGuard } from './platform-auth.guard';
import { PlatformTenantsService } from './platform-tenants.service';

@ApiTags('PlatformTenants')
@ApiBearerAuth('platformAuth')
@UseGuards(PlatformAuthGuard)
@Controller('platform/tenants')
export class PlatformTenantsController {
  constructor(private readonly tenants: PlatformTenantsService) {}

  @Get()
  list(@Query() query: ListPlatformTenantsDto) {
    return this.tenants.listTenants(query);
  }

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenants.getTenant(id);
  }

  @Post()
  @ApiBody({ type: CreatePlatformTenantDto })
  create(@Body() dto: CreatePlatformTenantDto) {
    return this.tenants.createTenant(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.tenants.updateStatus(id, dto.isActive);
  }

  @Patch(':id/max-devices')
  updateMaxDevices(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMaxDevicesDto,
  ) {
    return this.tenants.updateMaxDevices(id, dto.maxDevices);
  }

  @Get(':id/devices')
  devices(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenants.getTenantDevices(id);
  }

  @Get(':id/users')
  users(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenants.getTenantUsers(id);
  }

  @Get(':id/stores')
  stores(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenants.getTenantStores(id);
  }
}
