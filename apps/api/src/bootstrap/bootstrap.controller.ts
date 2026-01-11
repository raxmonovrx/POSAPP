import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { BootstrapService } from './bootstrap.service';
import { BootstrapDto } from './dto/bootstrap.dto';

@ApiTags('Bootstrap')
@Controller()
export class BootstrapController {
  constructor(private readonly svc: BootstrapService) {}

  @Post('bootstrap')
  @ApiBody({ description: 'Create tenant + store + owner + device', type: BootstrapDto })
  bootstrap(@Body() body: BootstrapDto) {
    return this.svc.bootstrap(body);
  }
}
