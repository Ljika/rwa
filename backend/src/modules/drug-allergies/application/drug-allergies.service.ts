import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DrugAllergy } from '../../../database/entities/drug-allergy.entity';
import { Drug } from '../../../database/entities/drug.entity';
import { Allergy } from '../../../database/entities/allergy.entity';
import { CreateDrugAllergyDto } from './dto/create-drug-allergy.dto';

@Injectable()
export class DrugAllergiesService {
  constructor(
    @InjectRepository(DrugAllergy)
    private drugAllergyRepository: Repository<DrugAllergy>,
    @InjectRepository(Drug)
    private drugRepository: Repository<Drug>,
    @InjectRepository(Allergy)
    private allergyRepository: Repository<Allergy>,
  ) {}

  async create(createDrugAllergyDto: CreateDrugAllergyDto): Promise<DrugAllergy> {
    const { drugId, allergyId } = createDrugAllergyDto;

    // Proveri da li lek postoji
    const drug = await this.drugRepository.findOne({
      where: { id: drugId },
    });

    if (!drug) {
      throw new NotFoundException('Lek nije pronađen');
    }

    // Proveri da li alergija postoji
    const allergy = await this.allergyRepository.findOne({
      where: { id: allergyId },
    });

    if (!allergy) {
      throw new NotFoundException('Alergija nije pronađena');
    }

    // Proveri da li lek već ima povezanu ovu alergiju
    const existing = await this.drugAllergyRepository.findOne({
      where: { drugId, allergyId },
    });

    if (existing) {
      throw new BadRequestException('Lek već ima povezanu ovu alergiju');
    }

    const drugAllergy = this.drugAllergyRepository.create(createDrugAllergyDto);
    return this.drugAllergyRepository.save(drugAllergy);
  }

  async findByDrug(drugId: string): Promise<DrugAllergy[]> {
    return this.drugAllergyRepository.find({
      where: { drugId },
      relations: ['allergy'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const drugAllergy = await this.drugAllergyRepository.findOne({
      where: { id },
    });

    if (!drugAllergy) {
      throw new NotFoundException('Alergija leka nije pronađena');
    }

    await this.drugAllergyRepository.remove(drugAllergy);
  }
}
