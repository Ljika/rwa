import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Shift } from '../../../../common/enums/shift.enum';

export class UpdateDoctorScheduleDto {
  @ApiPropertyOptional({ 
    example: 'Afternoon', 
    description: 'Nova smena',
    enum: Shift,
  })
  @IsEnum(Shift)
  @IsOptional()
  shift?: Shift;
}
