import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSchedulesService } from './application/doctor-schedules.service';
import { DoctorSchedulesController } from './presentation/doctor-schedules.controller';
import { DoctorSchedule } from '../../database/entities/doctor-schedule.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorSchedule, User])],
  controllers: [DoctorSchedulesController],
  providers: [DoctorSchedulesService],
  exports: [DoctorSchedulesService],
})
export class DoctorSchedulesModule {}
