import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateMaxDevicesDto {
  @ApiProperty({ minimum: 1, example: 5 })
  @IsInt()
  @Min(1)
  maxDevices!: number;
}
