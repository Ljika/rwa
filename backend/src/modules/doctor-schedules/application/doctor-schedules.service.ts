import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorSchedule } from '../../../database/entities/doctor-schedule.entity';
import { User } from '../../../database/entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';

@Injectable()
export class DoctorSchedulesService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createScheduleDto: CreateDoctorScheduleDto): Promise<DoctorSchedule> {
    const { doctorId, date, shift } = createScheduleDto;

    const doctor = await this.userRepository.findOne({
      where: { id: doctorId, role: UserRole.Doctor, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doktor nije pronađen ili nije aktivan');
    }

    const existingSchedule = await this.scheduleRepository.findOne({
      where: { doctorId, date: new Date(date) },
    });

    if (existingSchedule) {
      throw new ConflictException('Doktor već ima smenu za ovaj dan');
    }

    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      throw new BadRequestException('Ne možete dodati smenu za prošli datum');
    }

    const schedule = this.scheduleRepository.create({
      doctorId,
      date: new Date(date),
      shift,
    });

    return this.scheduleRepository.save(schedule);
  }

  async findAll(): Promise<DoctorSchedule[]> {
    return this.scheduleRepository.find({
      relations: ['doctor'],
      order: { date: 'ASC' },
    });
  }

  async findByDoctor(doctorId: string): Promise<DoctorSchedule[]> {
    return this.scheduleRepository.find({
      where: { doctorId },
      order: { date: 'ASC' },
    });
  }

  async findByDoctorAndDate(doctorId: string, date: string): Promise<DoctorSchedule | null> {
    return this.scheduleRepository.findOne({
      where: { doctorId, date: new Date(date) },
    });
  }

  async findOne(id: string): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });

    if (!schedule) {
      throw new NotFoundException('Smena nije pronađena');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateDoctorScheduleDto): Promise<DoctorSchedule> {
    const schedule = await this.findOne(id);

    if (updateScheduleDto.shift) {
      schedule.shift = updateScheduleDto.shift;
    }

    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }
}
