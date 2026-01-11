import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTenantStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
