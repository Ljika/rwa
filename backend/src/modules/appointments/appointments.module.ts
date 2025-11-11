import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './application/appointments.service.js';
import { AppointmentsController } from './presentation/appointments.controller.js';
import { Appointment } from '../../database/entities/appointment.entity.js';
import { User } from '../../database/entities/user.entity.js';
import { DoctorPatient } from '../../database/entities/doctor-patient.entity.js';
import { DoctorSchedule } from '../../database/entities/doctor-schedule.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, DoctorPatient, DoctorSchedule])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
