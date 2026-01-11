import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchPlatformDeviceStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}
