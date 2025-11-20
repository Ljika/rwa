import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugAllergiesController } from './presentation/drug-allergies.controller';
import { DrugAllergiesService } from './application/drug-allergies.service';
import { DrugAllergy } from '../../database/entities/drug-allergy.entity';
import { Drug } from '../../database/entities/drug.entity';
import { Allergy } from '../../database/entities/allergy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DrugAllergy, Drug, Allergy])],
  controllers: [DrugAllergiesController],
  providers: [DrugAllergiesService],
  exports: [DrugAllergiesService],
})
export class DrugAllergiesModule {}
