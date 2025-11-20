import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientAllergyDto {
  @ApiProperty({ description: 'ID pacijenta' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID alergije' })
  @IsUUID()
  allergyId: string;

  @ApiPropertyOptional({ description: 'Datum dijagnoze', example: '2025-11-20' })
  @IsDateString()
  @IsOptional()
  diagnosedDate?: Date;
}
