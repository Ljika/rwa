import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientAllergy } from '../../../database/entities/patient-allergy.entity';
import { User } from '../../../database/entities/user.entity';
import { Allergy } from '../../../database/entities/allergy.entity';
import { CreatePatientAllergyDto } from './dto/create-patient-allergy.dto';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class PatientAllergiesService {
  constructor(
    @InjectRepository(PatientAllergy)
    private patientAllergyRepository: Repository<PatientAllergy>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Allergy)
    private allergyRepository: Repository<Allergy>,
  ) {}

  async create(createPatientAllergyDto: CreatePatientAllergyDto): Promise<PatientAllergy> {
    const { patientId, allergyId } = createPatientAllergyDto;

    // Proveri da li pacijent postoji
    const patient = await this.userRepository.findOne({
      where: { id: patientId, role: UserRole.Patient, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException('Pacijent nije pronađen');
    }

    // Proveri da li alergija postoji
    const allergy = await this.allergyRepository.findOne({
      where: { id: allergyId },
    });

    if (!allergy) {
      throw new NotFoundException('Alergija nije pronađena');
    }

    // Proveri da li pacijent već ima ovu alergiju
    const existing = await this.patientAllergyRepository.findOne({
      where: { patientId, allergyId },
    });

    if (existing) {
      throw new BadRequestException('Pacijent već ima dodeljenu ovu alergiju');
    }

    const patientAllergy = this.patientAllergyRepository.create(createPatientAllergyDto);
    return this.patientAllergyRepository.save(patientAllergy);
  }

  async findAll(): Promise<PatientAllergy[]> {
    return this.patientAllergyRepository.find({
      relations: ['allergy', 'patient'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPatient(patientId: string): Promise<PatientAllergy[]> {
    return this.patientAllergyRepository.find({
      where: { patientId },
      relations: ['allergy'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const patientAllergy = await this.patientAllergyRepository.findOne({
      where: { id },
    });

    if (!patientAllergy) {
      throw new NotFoundException('Alergija pacijenta nije pronađena');
    }

    await this.patientAllergyRepository.remove(patientAllergy);
  }
}
