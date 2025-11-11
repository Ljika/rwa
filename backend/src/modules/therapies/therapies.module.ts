import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TherapiesService } from './application/therapies.service.js';
import { TherapiesController } from './presentation/therapies.controller.js';
import { Therapy } from '../../database/entities/therapy.entity.js';
import { TherapyDrug } from '../../database/entities/therapy-drug.entity.js';
import { Appointment } from '../../database/entities/appointment.entity.js';
import { Drug } from '../../database/entities/drug.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Therapy,
      TherapyDrug,
      Appointment,
      Drug,
    ]),
  ],
  controllers: [TherapiesController],
  providers: [TherapiesService],
  exports: [TherapiesService],
})
export class TherapiesModule {}
