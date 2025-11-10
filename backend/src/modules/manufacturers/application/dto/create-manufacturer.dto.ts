import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManufacturerDto {
  @ApiProperty({ example: 'Hemofarm', description: 'Ime proizvođača' })
  @IsString()
  @IsNotEmpty({ message: 'Ime je obavezno' })
  name: string;

  @ApiProperty({ example: 'Srbija', description: 'Država sedišta' })
  @IsString()
  @IsNotEmpty({ message: 'Država je obavezna' })
  country: string;

  @ApiPropertyOptional({ example: 'contact@hemofarm.com', description: 'Kontakt email' })
  @IsEmail({}, { message: 'Email mora biti validan' })
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'www.hemofarm.com', description: 'Web sajt proizvođača' })
  @IsString()
  @IsOptional()
  website?: string;
}
