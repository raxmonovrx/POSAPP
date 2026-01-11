import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResetDeviceKeyDto {
  @ApiPropertyOptional({ maxLength: 255, example: 'Device reformatted' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
