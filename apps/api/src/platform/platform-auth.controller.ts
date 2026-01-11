import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { PlatformAuthService } from './platform-auth.service';

@ApiTags('PlatformAuth')
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly auth: PlatformAuthService) {}

  @Post('login')
  @ApiBody({ type: PlatformLoginDto })
  login(@Body() dto: PlatformLoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
