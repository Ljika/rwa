import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentTypesService } from './appointment-types.service';
import { AppointmentTypesController } from './appointment-types.controller';
import { AppointmentType } from '../../database/entities/appointment-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentType])],
  controllers: [AppointmentTypesController],
  providers: [AppointmentTypesService],
  exports: [AppointmentTypesService],
})
export class AppointmentTypesModule {}
