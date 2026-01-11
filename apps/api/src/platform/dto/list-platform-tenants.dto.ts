import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListPlatformTenantsDto {
  @ApiPropertyOptional({ description: 'Search by tenant name' })
  @IsOptional()
  @IsString()
  q?: string;
}
