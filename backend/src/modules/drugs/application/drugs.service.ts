import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drug } from '../../../database/entities/drug.entity';
import { Manufacturer } from '../../../database/entities/manufacturer.entity';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';

@Injectable()
export class DrugsService {
  constructor(
    @InjectRepository(Drug)
    private drugRepository: Repository<Drug>,
    @InjectRepository(Manufacturer)
    private manufacturerRepository: Repository<Manufacturer>,
  ) {}

  async create(createDrugDto: CreateDrugDto): Promise<Drug> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { id: createDrugDto.manufacturerId },
    });

    if (!manufacturer) {
      throw new NotFoundException('Proizvođač nije pronađen');
    }

    if (!manufacturer.isActive) {
      throw new ConflictException('Proizvođač nije aktivan');
    }

    const existingDrug = await this.drugRepository.findOne({
      where: { 
        name: createDrugDto.name,
        dosage: createDrugDto.dosage,
      },
    });

    if (existingDrug) {
      throw new ConflictException('Lek sa ovim imenom i doziranjem već postoji');
    }

    const drug = this.drugRepository.create(createDrugDto);
    return this.drugRepository.save(drug);
  }

  async findAll(): Promise<Drug[]> {
    return this.drugRepository.find({
      relations: ['manufacturer'],
      order: { name: 'ASC' },
    });
  }

  async findByManufacturer(manufacturerId: string): Promise<Drug[]> {
    return this.drugRepository.find({
      where: { manufacturerId },
      relations: ['manufacturer'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Drug> {
    const drug = await this.drugRepository.findOne({
      where: { id },
      relations: ['manufacturer', 'therapyDrugs'],
    });

    if (!drug) {
      throw new NotFoundException('Lek nije pronađen');
    }

    return drug;
  }

  async update(id: string, updateDrugDto: UpdateDrugDto): Promise<Drug> {
    const drug = await this.findOne(id);

    if (updateDrugDto.manufacturerId) {
      const manufacturer = await this.manufacturerRepository.findOne({
        where: { id: updateDrugDto.manufacturerId },
      });

      if (!manufacturer) {
        throw new NotFoundException('Proizvođač nije pronađen');
      }

      if (!manufacturer.isActive) {
        throw new ConflictException('Proizvođač nije aktivan');
      }
    }

    if (updateDrugDto.name || updateDrugDto.dosage) {
      const existingDrug = await this.drugRepository.findOne({
        where: {
          name: updateDrugDto.name || drug.name,
          dosage: updateDrugDto.dosage || drug.dosage,
        },
      });

      if (existingDrug && existingDrug.id !== id) {
        throw new ConflictException('Lek sa ovim imenom i doziranjem već postoji');
      }
    }

    Object.assign(drug, updateDrugDto);
    return this.drugRepository.save(drug);
  }

  async remove(id: string): Promise<void> {
    const drug = await this.findOne(id);
    await this.drugRepository.remove(drug);
  }
}
