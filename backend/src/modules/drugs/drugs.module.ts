import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drug } from '../../database/entities/drug.entity';
import { Manufacturer } from '../../database/entities/manufacturer.entity';
import { DrugsService } from './application/drugs.service';
import { DrugsController } from './presentation/drugs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Drug, Manufacturer])],
  controllers: [DrugsController],
  providers: [DrugsService],
  exports: [DrugsService],
})
export class DrugsModule {}
