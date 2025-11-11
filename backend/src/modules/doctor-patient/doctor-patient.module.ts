import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorPatient } from '../../database/entities/doctor-patient.entity';
import { User } from '../../database/entities/user.entity';
import { DoctorPatientService } from './application/doctor-patient.service';
import { DoctorPatientController } from './presentation/doctor-patient.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorPatient, User])],
  controllers: [DoctorPatientController],
  providers: [DoctorPatientService],
  exports: [DoctorPatientService],
})
export class DoctorPatientModule {}
