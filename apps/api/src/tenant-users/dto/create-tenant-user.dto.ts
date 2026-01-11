import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateTenantUserDto {
  @ApiProperty({ example: 'cashier@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6, example: 'Secret123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: ['admin', 'cashier'], example: 'cashier' })
  @IsString()
  @IsIn(['admin', 'cashier'])
  role!: 'admin' | 'cashier';
}
