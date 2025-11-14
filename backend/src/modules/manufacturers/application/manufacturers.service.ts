import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Manufacturer } from '../../../database/entities/manufacturer.entity';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';

@Injectable()
export class ManufacturersService {
  constructor(
    @InjectRepository(Manufacturer)
    private manufacturerRepository: Repository<Manufacturer>,
  ) {}

  async create(createManufacturerDto: CreateManufacturerDto): Promise<Manufacturer> {
    const existingManufacturer = await this.manufacturerRepository.findOne({
      where: { name: createManufacturerDto.name },
    });

    if (existingManufacturer) {
      throw new ConflictException('Proizvođač sa ovim imenom već postoji');
    }

    const manufacturer = this.manufacturerRepository.create(createManufacturerDto);
    return this.manufacturerRepository.save(manufacturer);
  }

  async findAll(): Promise<Manufacturer[]> {
    return this.manufacturerRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Manufacturer> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { id },
      relations: ['drugs'], 
    });

    if (!manufacturer) {
      throw new NotFoundException('Proizvođač nije pronađen');
    }

    return manufacturer;
  }

  async update(id: string, updateManufacturerDto: UpdateManufacturerDto): Promise<Manufacturer> {
    const manufacturer = await this.findOne(id);

    if (updateManufacturerDto.name && updateManufacturerDto.name !== manufacturer.name) {
      const existingManufacturer = await this.manufacturerRepository.findOne({
        where: { name: updateManufacturerDto.name },
      });

      if (existingManufacturer) {
        throw new ConflictException('Proizvođač sa ovim imenom već postoji');
      }
    }

    Object.assign(manufacturer, updateManufacturerDto);
    return this.manufacturerRepository.save(manufacturer);
  }

  async remove(id: string): Promise<void> {
    await this.manufacturerRepository.delete(id);
  }
}
