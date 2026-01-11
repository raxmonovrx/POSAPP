import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapDto {
  @ApiProperty({ example: 'Otabek Books' })
  @IsString()
  @MinLength(2)
  tenantName!: string;

  @ApiProperty({ example: 'Main Store' })
  @IsString()
  @MinLength(2)
  storeName!: string;

  @ApiProperty({ example: 'owner@otabek.uz' })
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
}
