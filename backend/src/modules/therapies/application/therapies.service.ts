import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Therapy } from '../../../database/entities/therapy.entity.js';
import { TherapyDrug } from '../../../database/entities/therapy-drug.entity.js';
import { Appointment } from '../../../database/entities/appointment.entity.js';
import { Drug } from '../../../database/entities/drug.entity.js';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { CreateTherapyDto } from './dto/create-therapy.dto.js';
import { UpdateTherapyDto } from './dto/update-therapy.dto.js';
import { AddDrugToTherapyDto } from './dto/add-drug-to-therapy.dto.js';

@Injectable()
export class TherapiesService {
  constructor(
    @InjectRepository(Therapy)
    private therapyRepository: Repository<Therapy>,
    @InjectRepository(TherapyDrug)
    private therapyDrugRepository: Repository<TherapyDrug>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Drug)
    private drugRepository: Repository<Drug>,
  ) {}

  async create(createTherapyDto: CreateTherapyDto, doctorId: string): Promise<Therapy> {
    const { appointmentId, diagnosis, notes, drugs } = createTherapyDto;

    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['therapy'],
    });

    if (!appointment) {
      throw new NotFoundException('Termin nije pronađen');
    }

    if (appointment.status !== AppointmentStatus.Completed) {
      throw new BadRequestException('Terapija se može kreirati samo za završene termine (Completed)');
    }

    if (appointment.doctorId !== doctorId) {
      throw new ForbiddenException('Možete kreirati terapiju samo za svoje termine');
    }

    if (appointment.therapy) {
      throw new BadRequestException('Ovaj termin već ima terapiju');
    }

    const drugIds = drugs.map(d => d.drugId);
    const foundDrugs = await this.drugRepository.findByIds(drugIds);

    if (foundDrugs.length !== drugIds.length) {
      throw new BadRequestException('Neki od lekova ne postoje');
    }

    const therapy = this.therapyRepository.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId,
      diagnosis,
      notes,
      prescribedAt: new Date(),
    });

    const savedTherapy = await this.therapyRepository.save(therapy);

    const therapyDrugs = drugs.map(drug => 
      this.therapyDrugRepository.create({
        therapyId: savedTherapy.id,
        drugId: drug.drugId,
        timesPerDay: drug.timesPerDay,
        durationDays: drug.durationDays,
        instructions: drug.instructions,
      })
    );

    await this.therapyDrugRepository.save(therapyDrugs);

    return this.findOne(savedTherapy.id);
  }

  async findAll(): Promise<Therapy[]> {
    return this.therapyRepository.find({
      relations: ['doctor', 'patient', 'appointment', 'therapyDrugs', 'therapyDrugs.drug'],
      order: { prescribedAt: 'DESC' },
    });
  }

  async findByDoctor(doctorId: string): Promise<Therapy[]> {
    return this.therapyRepository.find({
      where: { doctorId },
      relations: ['patient', 'appointment', 'therapyDrugs', 'therapyDrugs.drug'],
      order: { prescribedAt: 'DESC' },
    });
  }

  async findByPatient(patientId: string): Promise<Therapy[]> {
    return this.therapyRepository.find({
      where: { patientId },
      relations: ['doctor', 'appointment', 'therapyDrugs', 'therapyDrugs.drug'],
      order: { prescribedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Therapy> {
    const therapy = await this.therapyRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'appointment', 'therapyDrugs', 'therapyDrugs.drug'],
    });

    if (!therapy) {
      throw new NotFoundException('Terapija nije pronađena');
    }

    return therapy;
  }

  async update(id: string, updateTherapyDto: UpdateTherapyDto, userId: string, userRole: string): Promise<Therapy> {
    const therapy = await this.findOne(id);

    if (userRole === UserRole.Doctor && therapy.doctorId !== userId) {
      throw new ForbiddenException('Možete ažurirati samo svoje terapije');
    }

    if (updateTherapyDto.diagnosis !== undefined) {
      therapy.diagnosis = updateTherapyDto.diagnosis;
    }

    if (updateTherapyDto.notes !== undefined) {
      therapy.notes = updateTherapyDto.notes;
    }

    await this.therapyRepository.save(therapy);
    return this.findOne(id);
  }

  async addDrug(therapyId: string, addDrugDto: AddDrugToTherapyDto, userId: string, userRole: string): Promise<Therapy> {
    const therapy = await this.findOne(therapyId);

    if (userRole === UserRole.Doctor && therapy.doctorId !== userId) {
      throw new ForbiddenException('Možete menjati samo svoje terapije');
    }

    const drug = await this.drugRepository.findOne({
      where: { id: addDrugDto.drugId },
    });

    if (!drug) {
      throw new NotFoundException('Lek nije pronađen');
    }

    const existingTherapyDrug = await this.therapyDrugRepository.findOne({
      where: { therapyId, drugId: addDrugDto.drugId },
    });

    if (existingTherapyDrug) {
      throw new BadRequestException('Ovaj lek je već dodat u terapiju');
    }

    const therapyDrug = this.therapyDrugRepository.create({
      therapyId,
      drugId: addDrugDto.drugId,
      timesPerDay: addDrugDto.timesPerDay,
      durationDays: addDrugDto.durationDays,
      instructions: addDrugDto.instructions,
    });

    await this.therapyDrugRepository.save(therapyDrug);

    return this.findOne(therapyId);
  }

  async removeDrug(therapyId: string, drugId: string, userId: string, userRole: string): Promise<Therapy> {
    const therapy = await this.findOne(therapyId);

    if (userRole === UserRole.Doctor && therapy.doctorId !== userId) {
      throw new ForbiddenException('Možete menjati samo svoje terapije');
    }

    const therapyDrug = await this.therapyDrugRepository.findOne({
      where: { therapyId, drugId },
    });

    if (!therapyDrug) {
      throw new NotFoundException('Ovaj lek nije deo terapije');
    }

    await this.therapyDrugRepository.remove(therapyDrug);

    return this.findOne(therapyId);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const therapy = await this.findOne(id);

    if (userRole === UserRole.Doctor && therapy.doctorId !== userId) {
      throw new ForbiddenException('Možete brisati samo svoje terapije');
    }

    await this.therapyRepository.remove(therapy);
  }
}
