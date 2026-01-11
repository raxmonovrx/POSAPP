import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(
  Strategy,
  'platform-jwt',
) {
  constructor(private readonly config: ConfigService) {
    const secret =
      config.get<string>('PLATFORM_JWT_SECRET', { infer: true }) ??
      config.get<string>('JWT_ACCESS_SECRET', { infer: true }) ??
      '';
    if (!secret) throw new Error('Platform JWT secret is not configured');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  validate(payload: any) {
    if (payload?.tokenType !== 'platformAdmin')
      throw new UnauthorizedException('Invalid platform token');
    return payload;
  }
}
