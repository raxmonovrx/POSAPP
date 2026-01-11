import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListDeviceResetAuditsDto {
  @ApiPropertyOptional({ description: 'Filter by tenantId', format: 'uuid' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Filter by deviceId', format: 'uuid' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
