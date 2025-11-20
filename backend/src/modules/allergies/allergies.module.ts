import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllergiesController } from './presentation/allergies.controller';
import { AllergiesService } from './application/allergies.service';
import { Allergy } from '../../database/entities/allergy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Allergy])],
  controllers: [AllergiesController],
  providers: [AllergiesService],
  exports: [AllergiesService],
})
export class AllergiesModule {}
