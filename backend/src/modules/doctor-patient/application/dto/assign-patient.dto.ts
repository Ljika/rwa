import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPatientDto {
  @ApiProperty({ example: 'uuid-doktora', description: 'ID doktora' })
  @IsUUID('4', { message: 'ID doktora mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID doktora je obavezan' })
  doctorId: string;

  @ApiProperty({ example: 'uuid-pacijenta', description: 'ID pacijenta' })
  @IsUUID('4', { message: 'ID pacijenta mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID pacijenta je obavezan' })
  patientId: string;
}
