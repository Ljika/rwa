import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Allergy } from '../../../database/entities/allergy.entity';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';

@Injectable()
export class AllergiesService {
  constructor(
    @InjectRepository(Allergy)
    private allergyRepository: Repository<Allergy>,
  ) {}

  async create(createAllergyDto: CreateAllergyDto): Promise<Allergy> {
    // Proveri da li alergija sa istim imenom već postoji
    const existing = await this.allergyRepository.findOne({
      where: { name: createAllergyDto.name },
    });

    if (existing) {
      throw new ConflictException('Alergija sa ovim imenom već postoji');
    }

    const allergy = this.allergyRepository.create(createAllergyDto);
    return this.allergyRepository.save(allergy);
  }

  async findAll(): Promise<Allergy[]> {
    return this.allergyRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Allergy> {
    const allergy = await this.allergyRepository.findOne({
      where: { id },
    });

    if (!allergy) {
      throw new NotFoundException('Alergija nije pronađena');
    }

    return allergy;
  }

  async update(id: string, updateAllergyDto: UpdateAllergyDto): Promise<Allergy> {
    const allergy = await this.findOne(id);

    // Proveri da li postoji druga alergija sa istim imenom
    if (updateAllergyDto.name) {
      const existing = await this.allergyRepository.findOne({
        where: { name: updateAllergyDto.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Alergija sa ovim imenom već postoji');
      }
    }

    Object.assign(allergy, updateAllergyDto);
    return this.allergyRepository.save(allergy);
  }

  async remove(id: string): Promise<void> {
    const allergy = await this.findOne(id);
    await this.allergyRepository.remove(allergy);
  }
}
