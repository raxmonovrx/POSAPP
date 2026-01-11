import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'POS-02', minLength: 2 })
  @IsString()
  @MinLength(2)
  deviceCode!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}
