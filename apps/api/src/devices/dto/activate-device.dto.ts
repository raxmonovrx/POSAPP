import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ActivateDeviceDto {
  @ApiProperty({ example: 'activation_key_from_server' })
  @IsString()
  @MinLength(10)
  deviceKey!: string;
}
