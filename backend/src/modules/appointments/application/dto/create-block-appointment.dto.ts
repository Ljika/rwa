import { IsUUID, IsDateString, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBlockAppointmentDto {
  @ApiProperty({ description: 'ID doktora' })
  @IsUUID()
  doctorId: string;

  @ApiProperty({ description: 'ID pacijenta (obavezno za operacije/procedure)' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Datum termina', example: '2025-11-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Početno vreme', example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Broj slotova (1 slot = 30min, 8 slotova = 4h)', example: 8 })
  @IsInt()
  @Min(1)
  @Max(16) // Maksimalno 8h
  numberOfSlots: number;

  @ApiProperty({ description: 'Razlog/Tip termina', example: 'OPERACIJA' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Dodatne napomene' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  notes?: string;
}
