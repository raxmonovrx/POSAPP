import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiBody({
    description: 'Tenant user login',
    type: LoginDto,
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
