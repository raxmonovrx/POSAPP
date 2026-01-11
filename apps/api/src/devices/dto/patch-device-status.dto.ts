import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchDeviceStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
