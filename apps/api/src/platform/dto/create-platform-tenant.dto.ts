import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePlatformTenantDto {
  @ApiProperty({ example: 'Client Co' })
  @IsString()
  @MinLength(2)
  tenantName!: string;

  @ApiProperty({ example: 'HQ' })
  @IsString()
  @MinLength(2)
  storeName!: string;

  @ApiProperty({ example: 'owner@client.co' })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({ minLength: 6, example: 'Secret123' })
  @IsString()
  @MinLength(6)
  ownerPassword!: string;

  @ApiProperty({ example: 'POS-01' })
  @IsString()
  @MinLength(2)
  deviceCode!: string;

  @ApiPropertyOptional({ minimum: 1, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDevices?: number;
}
