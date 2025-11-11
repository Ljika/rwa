import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../../../common/enums/appointment-status.enum';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ 
    enum: AppointmentStatus, 
    example: AppointmentStatus.Approved, 
    description: 'Novi status termina' 
  })
  @IsEnum(AppointmentStatus, { message: 'Status mora biti validan' })
  @IsNotEmpty({ message: 'Status je obavezan' })
  status: AppointmentStatus;
}
