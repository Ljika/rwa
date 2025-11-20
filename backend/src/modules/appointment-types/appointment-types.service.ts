import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentType } from '../../database/entities/appointment-type.entity';
import { CreateAppointmentTypeDto } from './dto/create-appointment-type.dto';
import { UpdateAppointmentTypeDto } from './dto/update-appointment-type.dto';
import { Specialization } from '../../common/enums/specialization.enum';

@Injectable()
export class AppointmentTypesService {
  constructor(
    @InjectRepository(AppointmentType)
    private appointmentTypesRepository: Repository<AppointmentType>,
  ) {}

  async create(createDto: CreateAppointmentTypeDto): Promise<AppointmentType> {
    const appointmentType = this.appointmentTypesRepository.create(createDto);
    return await this.appointmentTypesRepository.save(appointmentType);
  }

  async findAll(): Promise<AppointmentType[]> {
    return await this.appointmentTypesRepository.find({
      where: { isActive: true },
      order: { specialization: 'ASC', name: 'ASC' },
    });
  }

  async findBySpecialization(specialization: Specialization): Promise<AppointmentType[]> {
    return await this.appointmentTypesRepository.find({
      where: { specialization, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<AppointmentType> {
    const appointmentType = await this.appointmentTypesRepository.findOne({
      where: { id },
    });

    if (!appointmentType) {
      throw new NotFoundException(`Tip pregleda sa ID ${id} nije pronađen`);
    }

    return appointmentType;
  }

  async update(id: string, updateDto: UpdateAppointmentTypeDto): Promise<AppointmentType> {
    const appointmentType = await this.findOne(id);
    Object.assign(appointmentType, updateDto);
    return await this.appointmentTypesRepository.save(appointmentType);
  }

  async remove(id: string): Promise<void> {
    const appointmentType = await this.findOne(id);
    // Soft delete - samo postavi isActive na false
    appointmentType.isActive = false;
    await this.appointmentTypesRepository.save(appointmentType);
  }
}
