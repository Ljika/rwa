import { IsUUID, IsNotEmpty, IsString, IsArray, ValidateNested, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TherapyDrugDto {
  @ApiProperty({ example: 'uuid-leka', description: 'ID leka' })
  @IsUUID('4', { message: 'ID leka mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID leka je obavezan' })
  drugId: string;

  @ApiProperty({ example: 3, description: 'Koliko puta dnevno (1-10)' })
  @IsInt({ message: 'Mora biti ceo broj' })
  @Min(1, { message: 'Minimum 1 put dnevno' })
  @IsNotEmpty({ message: 'Broj puta dnevno je obavezan' })
  timesPerDay: number;

  @ApiProperty({ example: 7, description: 'Koliko dana (1-365)' })
  @IsInt({ message: 'Mora biti ceo broj' })
  @Min(1, { message: 'Minimum 1 dan' })
  @IsNotEmpty({ message: 'Trajanje u danima je obavezno' })
  durationDays: number;

  @ApiPropertyOptional({ example: 'Uzimati posle jela', description: 'Dodatne napomene' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateTherapyDto {
  @ApiProperty({ example: 'uuid-termina', description: 'ID završenog termina (Completed)' })
  @IsUUID('4', { message: 'ID termina mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID termina je obavezan' })
  appointmentId: string;

  @ApiProperty({ example: 'Upala grla, faringitis', description: 'Dijagnoza' })
  @IsString({ message: 'Dijagnoza mora biti string' })
  @IsNotEmpty({ message: 'Dijagnoza je obavezna' })
  diagnosis: string;

  @ApiPropertyOptional({ example: 'Kontrola za 7 dana', description: 'Napomene o terapiji' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ 
    description: 'Lista lekova sa doziranjem',
    type: [TherapyDrugDto],
    example: [
      { drugId: 'uuid-1', timesPerDay: 3, durationDays: 7, instructions: 'Posle jela' },
      { drugId: 'uuid-2', timesPerDay: 2, durationDays: 5, instructions: 'Pre spavanja' }
    ]
  })
  @IsArray({ message: 'Lekovi moraju biti niz' })
  @ValidateNested({ each: true })
  @Type(() => TherapyDrugDto)
  @IsNotEmpty({ message: 'Morate dodati bar jedan lek' })
  drugs: TherapyDrugDto[];
}
