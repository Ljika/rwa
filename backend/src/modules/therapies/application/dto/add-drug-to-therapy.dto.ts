import { IsUUID, IsNotEmpty, IsInt, Min, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddDrugToTherapyDto {
  @ApiProperty({ example: 'uuid-leka', description: 'ID leka koji se dodaje' })
  @IsUUID('all', { message: 'ID leka mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID leka je obavezan' })
  drugId: string;

  @ApiProperty({ example: 2, description: 'Koliko puta dnevno' })
  @IsInt({ message: 'Mora biti ceo broj' })
  @Min(1, { message: 'Minimum 1 put dnevno' })
  @IsNotEmpty({ message: 'Broj puta dnevno je obavezan' })
  timesPerDay: number;

  @ApiProperty({ example: 10, description: 'Koliko dana' })
  @IsInt({ message: 'Mora biti ceo broj' })
  @Min(1, { message: 'Minimum 1 dan' })
  @IsNotEmpty({ message: 'Trajanje u danima je obavezno' })
  durationDays: number;

  @ApiPropertyOptional({ example: 'Pre spavanja', description: 'Dodatne napomene' })
  @IsString()
  @IsOptional()
  instructions?: string;
}
