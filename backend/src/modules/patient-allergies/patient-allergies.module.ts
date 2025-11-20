import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientAllergiesController } from './presentation/patient-allergies.controller';
import { PatientAllergiesService } from './application/patient-allergies.service';
import { PatientAllergy } from '../../database/entities/patient-allergy.entity';
import { User } from '../../database/entities/user.entity';
import { Allergy } from '../../database/entities/allergy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientAllergy, User, Allergy])],
  controllers: [PatientAllergiesController],
  providers: [PatientAllergiesService],
  exports: [PatientAllergiesService],
})
export class PatientAllergiesModule {}
