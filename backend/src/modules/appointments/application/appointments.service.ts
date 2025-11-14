import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';
import { User } from '../../../database/entities/user.entity';
import { DoctorPatient } from '../../../database/entities/doctor-patient.entity';
import { DoctorSchedule } from '../../../database/entities/doctor-schedule.entity';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { TimeSlot, getTimeSlotsByShift } from '../../../common/enums/time-slot.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DoctorPatient)
    private doctorPatientRepository: Repository<DoctorPatient>,
    @InjectRepository(DoctorSchedule)
    private scheduleRepository: Repository<DoctorSchedule>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, patientId: string): Promise<Appointment> {
    try {
      console.log('CREATE APPOINTMENT - Primljeni podaci:', createAppointmentDto);
      console.log('CREATE APPOINTMENT - Patient ID:', patientId);
      
      const { doctorId, date, timeSlot, reason, notes } = createAppointmentDto;

      const doctor = await this.userRepository.findOne({
        where: { id: doctorId, role: UserRole.Doctor, isActive: true },
      });

      if (!doctor) {
        throw new NotFoundException('Doktor nije pronađen ili nije aktivan');
      }

      const patient = await this.userRepository.findOne({
        where: { id: patientId, role: UserRole.Patient, isActive: true },
      });

      if (!patient) {
        throw new NotFoundException('Pacijent nije pronađen ili nije aktivan');
      }

      const link = await this.doctorPatientRepository.findOne({
        where: { doctorId, patientId },
      });

    if (!link) {
      throw new ForbiddenException('Ne možete zakazati termin kod ovog doktora. Admin mora prvo da vas dodeli ovom doktoru.');
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException('Ne možete zakazati termin za prošli datum');
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { doctorId, date: appointmentDate },
    });

    if (!schedule) {
      throw new BadRequestException('Doktor ne radi tog dana');
    }

    const allowedSlots = getTimeSlotsByShift(schedule.shift);
    if (!allowedSlots.includes(timeSlot)) {
      throw new BadRequestException(`Termin ${timeSlot} nije dostupan u smeni doktora za taj dan`);
    }

    const existingAppointment = await this.appointmentRepository.findOne({
      where: { 
        doctorId, 
        date: appointmentDate, 
        timeSlot,
        status: AppointmentStatus.Pending,
      },
    });

    const existingApproved = await this.appointmentRepository.findOne({
      where: { 
        doctorId, 
        date: appointmentDate, 
        timeSlot,
        status: AppointmentStatus.Approved,
      },
    });

    if (existingAppointment || existingApproved) {
      throw new BadRequestException('Ovaj termin je već zauzet');
    }

      const appointment = this.appointmentRepository.create({
        doctorId,
        patientId,
        date: appointmentDate,
        timeSlot,
        reason,
        notes,
        status: AppointmentStatus.Pending,
      });

      console.log('CREATE APPOINTMENT - Kreiran appointment objekat:', appointment);
      const saved = await this.appointmentRepository.save(appointment);
      console.log('CREATE APPOINTMENT - Sačuvan appointment:', saved);
      return saved;
    } catch (error) {
      console.error('CREATE APPOINTMENT - GREŠKA:', error);
      console.error('CREATE APPOINTMENT - Error stack:', error.stack);
      throw error;
    }
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);

    const doctor = await this.userRepository.findOne({
      where: { id: doctorId, role: UserRole.Doctor, isActive: true },
    });

    if (!doctor) {
      throw new NotFoundException('Doktor nije pronađen');
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { doctorId, date: appointmentDate },
    });

    if (!schedule) {
      return []; 
    }

    const allSlots = getTimeSlotsByShift(schedule.shift);

    const occupiedAppointments = await this.appointmentRepository.find({
      where: { 
        doctorId, 
        date: appointmentDate,
      },
    });

    const occupiedSlots = occupiedAppointments
      .filter(apt => apt.status === AppointmentStatus.Pending || apt.status === AppointmentStatus.Approved)
      .map(apt => apt.timeSlot);

    const availableSlots = allSlots.filter(slot => !occupiedSlots.includes(slot));

    return availableSlots;
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['doctor', 'patient'],
      order: { date: 'DESC', timeSlot: 'ASC' },
    });
  }

  async findMyAppointmentsAsPatient(patientId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor'],
      order: { date: 'DESC', timeSlot: 'ASC' },
    });
  }

  async findMyAppointmentsAsDoctor(doctorId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { doctorId },
      relations: ['patient'],
      order: { date: 'DESC', timeSlot: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'therapy'],
    });

    if (!appointment) {
      throw new NotFoundException('Termin nije pronađen');
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, userId: string, userRole: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // Pacijent može da ažurira samo svoje termine i samo ako su Pending
    if (userRole === UserRole.Patient) {
      if (appointment.patientId !== userId) {
        throw new ForbiddenException('Ne možete ažurirati tuđe termine');
      }
      if (appointment.status !== AppointmentStatus.Pending) {
        throw new BadRequestException('Možete ažurirati samo termine sa statusom Pending');
      }
    }
    if (userRole === UserRole.Doctor) {
      throw new ForbiddenException('Doktor može samo da menja status termina, ne i osnovne podatke');
    }

    if (updateAppointmentDto.date || updateAppointmentDto.timeSlot) {
      const newDate = updateAppointmentDto.date ? new Date(updateAppointmentDto.date) : appointment.date;
      const newTimeSlot = updateAppointmentDto.timeSlot || appointment.timeSlot;

      newDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newDate < today) {
        throw new BadRequestException('Ne možete zakazati termin za prošli datum');
      }

      const schedule = await this.scheduleRepository.findOne({
        where: { doctorId: appointment.doctorId, date: newDate },
      });

      if (!schedule) {
        throw new BadRequestException('Doktor ne radi tog dana');
      }

      const allowedSlots = getTimeSlotsByShift(schedule.shift);
      if (!allowedSlots.includes(newTimeSlot)) {
        throw new BadRequestException(`Termin ${newTimeSlot} nije dostupan u smeni doktora`);
      }

      const existingAppointment = await this.appointmentRepository.findOne({
        where: { 
          doctorId: appointment.doctorId, 
          date: newDate, 
          timeSlot: newTimeSlot,
          status: AppointmentStatus.Pending,
        },
      });

      const existingApproved = await this.appointmentRepository.findOne({
        where: { 
          doctorId: appointment.doctorId, 
          date: newDate, 
          timeSlot: newTimeSlot,
          status: AppointmentStatus.Approved,
        },
      });

      if ((existingAppointment && existingAppointment.id !== id) || 
          (existingApproved && existingApproved.id !== id)) {
        throw new BadRequestException('Ovaj termin je već zauzet');
      }

      appointment.date = newDate;
      appointment.timeSlot = newTimeSlot;
    }

    if (updateAppointmentDto.reason !== undefined) {
      appointment.reason = updateAppointmentDto.reason;
    }

    if (updateAppointmentDto.notes !== undefined) {
      appointment.notes = updateAppointmentDto.notes;
    }

    return this.appointmentRepository.save(appointment);
  }

  async updateStatus(id: string, updateStatusDto: UpdateAppointmentStatusDto, userId: string, userRole: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (userRole === UserRole.Patient) {
      if (appointment.patientId !== userId) {
        throw new ForbiddenException('Ne možete otkazati tuđe termine');
      }
      if (updateStatusDto.status !== AppointmentStatus.Cancelled) {
        throw new ForbiddenException('Pacijent može samo da otkaže termin');
      }
    }

    if (userRole === UserRole.Doctor) {
      if (appointment.doctorId !== userId) {
        throw new ForbiddenException('Ne možete menjati status tuđih termina');
      }
      if (appointment.status === AppointmentStatus.Pending) {
        if (![AppointmentStatus.Approved, AppointmentStatus.Rejected].includes(updateStatusDto.status)) {
          throw new BadRequestException('Pending termin možete samo odobriti ili odbiti');
        }
      } else if (appointment.status === AppointmentStatus.Approved) {
        if (![AppointmentStatus.Completed, AppointmentStatus.Cancelled].includes(updateStatusDto.status)) {
          throw new BadRequestException('Odobreni termin možete samo označiti kao završen ili otkazati');
        }
      } else {
        throw new BadRequestException('Ne možete menjati status ovog termina');
      }
    }

    // Ako se status menja u Cancelled ili Rejected, brišemo termin iz baze
    if (
      updateStatusDto.status === AppointmentStatus.Cancelled ||
      updateStatusDto.status === AppointmentStatus.Rejected
    ) {
      await this.appointmentRepository.remove(appointment);
      // Vraćamo objekat sa statusom za frontend, iako je obrisan
      return { ...appointment, status: updateStatusDto.status } as Appointment;
    }

    appointment.status = updateStatusDto.status;
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const appointment = await this.findOne(id);

    if (userRole === UserRole.Patient) {
      if (appointment.patientId !== userId) {
        throw new ForbiddenException('Ne možete obrisati tuđe termine');
      }
      if (appointment.status !== AppointmentStatus.Pending) {
        throw new BadRequestException('Možete obrisati samo termine sa statusom Pending');
      }
    }

    if (userRole === UserRole.Doctor) {
      throw new ForbiddenException('Doktor ne može da briše termine, samo da menja njihov status');
    }

    await this.appointmentRepository.remove(appointment);
  }
}
