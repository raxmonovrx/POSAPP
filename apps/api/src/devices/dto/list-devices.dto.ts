import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListDevicesQueryDto {
  @ApiPropertyOptional({ description: 'Search by deviceCode' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by active flag', type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    return value === 'true' || value === true;
  })
  isActive?: boolean;
}
