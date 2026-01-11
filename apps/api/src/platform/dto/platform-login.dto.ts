import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class PlatformLoginDto {
  @ApiProperty({ example: 'admin@posapp.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6, example: 'StrongPass123' })
  @IsString()
  @MinLength(6)
  password!: string;
}
