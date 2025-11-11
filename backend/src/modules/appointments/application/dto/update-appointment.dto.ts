import { IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeSlot } from '../../../../common/enums/time-slot.enum';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: '2025-11-16', description: 'Novi datum termina' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ 
    example: '14:00', 
    description: 'Novo vreme termina',
    enum: TimeSlot,
  })
  @IsEnum(TimeSlot)
  @IsOptional()
  timeSlot?: TimeSlot;

  @ApiPropertyOptional({ example: 'Pregled štitne žlezde', description: 'Razlog za posetu' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Doneti prethodne nalaze', description: 'Napomena' })
  @IsString()
  @IsOptional()
  notes?: string;
}
