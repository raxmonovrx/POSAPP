import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PatchTenantUserPasswordDto {
  @ApiProperty({ minLength: 6, example: 'NewSecret123' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
