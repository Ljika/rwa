import { IsUUID, IsNotEmpty, IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeSlot } from '../../../../common/enums/time-slot.enum';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-doktora', description: 'ID doktora kod koga se zakazuje termin' })
  @IsUUID('4', { message: 'ID doktora mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID doktora je obavezan' })
  doctorId: string;

  @ApiPropertyOptional({ example: 'uuid-pacijenta', description: 'ID pacijenta (opciono, koristi se kada doktor zakažuje termin)' })
  @IsUUID('4', { message: 'ID pacijenta mora biti validan UUID' })
  @IsOptional()
  patientId?: string;

  @ApiProperty({ example: '2025-11-15', description: 'Datum termina (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Datum mora biti u ISO 8601 formatu' })
  @IsNotEmpty({ message: 'Datum termina je obavezan' })
  date: string;

  @ApiProperty({ 
    example: '10:00', 
    description: 'Vreme termina (slot od 30min)',
    enum: TimeSlot,
  })
  @IsEnum(TimeSlot, { message: 'Vreme mora biti validno (08:00, 08:30, ...)' })
  @IsNotEmpty({ message: 'Vreme termina je obavezno' })
  timeSlot: TimeSlot;

  @ApiPropertyOptional({ example: 'Kontrolni pregled', description: 'Razlog za posetu' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Bolovi u grudima', description: 'Napomena' })
  @IsString()
  @IsOptional()
  notes?: string;
}
