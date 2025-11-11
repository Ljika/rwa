import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorPatient } from '../../../database/entities/doctor-patient.entity';
import { User } from '../../../database/entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AssignPatientDto } from './dto/assign-patient.dto';

@Injectable()
export class DoctorPatientService {
  constructor(
    @InjectRepository(DoctorPatient)
    private doctorPatientRepository: Repository<DoctorPatient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async assignPatientToDoctor(assignPatientDto: AssignPatientDto): Promise<DoctorPatient> {
    const { doctorId, patientId } = assignPatientDto;

    const doctor = await this.userRepository.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doktor nije pronađen');
    }

    if (doctor.role !== UserRole.Doctor) {
      throw new BadRequestException('Korisnik nije doktor');
    }

    if (!doctor.isActive) {
      throw new BadRequestException('Doktor nije aktivan');
    }

    const patient = await this.userRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Pacijent nije pronađen');
    }

    if (patient.role !== UserRole.Patient) {
      throw new BadRequestException('Korisnik nije pacijent');
    }

    if (!patient.isActive) {
      throw new BadRequestException('Pacijent nije aktivan');
    }

    const existingLink = await this.doctorPatientRepository.findOne({
      where: { doctorId, patientId },
    });

    if (existingLink) {
      throw new ConflictException('Pacijent je već dodeljen ovom doktoru');
    }

    const link = this.doctorPatientRepository.create({
      doctorId,
      patientId,
    });

    return this.doctorPatientRepository.save(link);
  }

  async getDoctorPatients(doctorId: string): Promise<User[]> {
    const doctor = await this.userRepository.findOne({
      where: { id: doctorId, role: UserRole.Doctor },
    });

    if (!doctor) {
      throw new NotFoundException('Doktor nije pronađen');
    }

    const links = await this.doctorPatientRepository.find({
      where: { doctorId },
      relations: ['patient'],
    });

    return links.map(link => link.patient);
  }

  async getPatientDoctors(patientId: string): Promise<User[]> {
    const patient = await this.userRepository.findOne({
      where: { id: patientId, role: UserRole.Patient },
    });

    if (!patient) {
      throw new NotFoundException('Pacijent nije pronađen');
    }

    const links = await this.doctorPatientRepository.find({
      where: { patientId },
      relations: ['doctor'],
    });

    return links.map(link => link.doctor);
  }

  async getAllLinks(): Promise<DoctorPatient[]> {
    return this.doctorPatientRepository.find({
      relations: ['doctor', 'patient'],
      order: { assignedAt: 'DESC' },
    });
  }

  async removeLink(doctorId: string, patientId: string): Promise<void> {
    const link = await this.doctorPatientRepository.findOne({
      where: { doctorId, patientId },
    });

    if (!link) {
      throw new NotFoundException('Veza između doktora i pacijenta nije pronađena');
    }

    await this.doctorPatientRepository.remove(link);
  }
}
