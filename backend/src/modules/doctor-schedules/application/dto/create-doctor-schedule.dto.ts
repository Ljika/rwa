import { IsUUID, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Shift } from '../../../../common/enums/shift.enum';

export class CreateDoctorScheduleDto {
  @ApiProperty({ example: 'uuid-doktora', description: 'ID doktora' })
  @IsUUID('4', { message: 'ID doktora mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID doktora je obavezan' })
  doctorId: string;

  @ApiProperty({ example: '2025-11-15', description: 'Datum smene (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Datum mora biti u ISO 8601 formatu' })
  @IsNotEmpty({ message: 'Datum je obavezan' })
  date: string;

  @ApiProperty({ 
    example: 'Morning', 
    description: 'Smena (Morning: 08-16h, Afternoon: 16-00h, Night: 00-08h)',
    enum: Shift,
  })
  @IsEnum(Shift, { message: 'Smena mora biti Morning, Afternoon ili Night' })
  @IsNotEmpty({ message: 'Smena je obavezna' })
  shift: Shift;
}
