import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformAuthGuard } from './platform-auth.guard';
import { ListDeviceResetAuditsDto } from './dto/list-device-reset-audits.dto';
import { PlatformAuditService } from './platform-audit.service';

@ApiTags('Audit')
@ApiBearerAuth('platformAuth')
@UseGuards(PlatformAuthGuard)
@Controller('platform/audit')
export class PlatformAuditController {
  constructor(private readonly audit: PlatformAuditService) {}

  @Get('device-resets')
  deviceResets(@Query() query: ListDeviceResetAuditsDto) {
    return this.audit.listDeviceResets(query);
  }
}
