import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateManufacturerDto {
  @ApiPropertyOptional({ example: 'Hemofarm AD', description: 'Ime proizvođača' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Srbija', description: 'Država sedišta' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'info@hemofarm.com', description: 'Kontakt email' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'www.hemofarm.com', description: 'Web sajt proizvođača' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: true, description: 'Da li je proizvođač aktivan' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
