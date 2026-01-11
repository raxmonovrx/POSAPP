import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class PatchTenantUserRoleDto {
  @ApiProperty({ enum: ['admin', 'cashier'], example: 'admin' })
  @IsString()
  @IsIn(['admin', 'cashier'])
  role!: 'admin' | 'cashier';
}
