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
import { CreateBlockAppointmentDto } from './dto/create-block-appointment.dto';

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

    //Ako je danas, proveri da li je vreme prošlo
    if (appointmentDate.getTime() === today.getTime()) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(appointmentDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const bufferTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minuta unapred

      if (slotDateTime <= bufferTime) {
        throw new BadRequestException('Ne možete zakazati termin koji je već prošao ili počinje uskoro (minimum 30 minuta unapred)');
      }
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

    // Proveri da li je slot zauzet sa aktivnim statusom 
    const existingActive = await this.appointmentRepository.findOne({
      where: [
        { doctorId, date: appointmentDate, timeSlot, status: AppointmentStatus.Pending },
        { doctorId, date: appointmentDate, timeSlot, status: AppointmentStatus.Approved },
        { doctorId, date: appointmentDate, timeSlot, status: AppointmentStatus.Completed },
      ],
    });

    if (existingActive) {
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

  async scheduleForPatient(createAppointmentDto: CreateAppointmentDto, doctorId: string): Promise<Appointment> {
    const { doctorId: dtodoctorId, date, timeSlot, reason, notes } = createAppointmentDto;
    const patientId = createAppointmentDto.patientId;

    // Proveri da li je doktor koji poziva metodu isti kao doktor u DTO (sigurnosna provera)
    if (dtodoctorId !== doctorId) {
      throw new ForbiddenException('Možete zakazivati termine samo za sebe');
    }

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

    // Proveri da li je pacijent dodeljen ovom doktoru
    const link = await this.doctorPatientRepository.findOne({
      where: { doctorId, patientId },
    });

    if (!link) {
      throw new ForbiddenException('Ovaj pacijent nije dodeljen vama');
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException('Ne možete zakazati termin za prošli datum');
    }

    //Ako je danas, proveri da li je vreme prošlo
    if (appointmentDate.getTime() === today.getTime()) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotDateTime = new Date(appointmentDate);
      slotDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const bufferTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minuta unapred

      if (slotDateTime <= bufferTime) {
        throw new BadRequestException('Ne možete zakazati termin koji je već prošao ili počinje uskoro (minimum 30 minuta unapred)');
      }
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { doctorId, date: appointmentDate },
    });

    if (!schedule) {
      throw new BadRequestException('Nemate smenu za taj dan');
    }

    const allowedSlots = getTimeSlotsByShift(schedule.shift);
    if (!allowedSlots.includes(timeSlot)) {
      throw new BadRequestException(`Termin ${timeSlot} nije dostupan u vašoj smeni za taj dan`);
    }

    // Proveri da li je termin već zauzet sa aktivnim statusom
    const existingActive = await this.appointmentRepository.findOne({
      where: [
        { doctorId, date: appointmentDate, timeSlot, status: AppointmentStatus.Pending },
        { doctorId, date: appointmentDate, timeSlot, status: AppointmentStatus.Approved },
        { doctorId, date: appointmentDate, timeSlot, status: AppointmentStatus.Completed },
      ],
    });

    if (existingActive) {
      throw new BadRequestException('Ovaj termin je već zauzet');
    }

    // Kreiraj termin sa statusom Approved (automatski odobren jer ga doktor zakazuje)
    const appointment = this.appointmentRepository.create({
      doctorId,
      patientId,
      date: appointmentDate,
      timeSlot,
      reason,
      notes,
      status: AppointmentStatus.Approved,
    });

    return await this.appointmentRepository.save(appointment);
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

    let availableSlots = allSlots.filter(slot => !occupiedSlots.includes(slot));

    // Ako je danas, ukloni prošle termine
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate.getTime() === today.getTime()) {
      //Filter slotove koji su prošli
      availableSlots = availableSlots.filter(slot => {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date(appointmentDate);
        slotTime.setHours(hours, minutes, 0, 0);
        
        // Dodaj 30 minuta buffer (da se ne bi zakazivao termin koji upravo počinje)
        const bufferTime = new Date(now.getTime() + 30 * 60 * 1000);
        
        return slotTime > bufferTime;
      });
    }

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

      // Proveri da li je novi slot zauzet sa aktivnim statusom
      const existingActive = await this.appointmentRepository.findOne({
        where: [
          { doctorId: appointment.doctorId, date: newDate, timeSlot: newTimeSlot, status: AppointmentStatus.Pending },
          { doctorId: appointment.doctorId, date: newDate, timeSlot: newTimeSlot, status: AppointmentStatus.Approved },
          { doctorId: appointment.doctorId, date: newDate, timeSlot: newTimeSlot, status: AppointmentStatus.Completed },
        ],
      });

      if (existingActive && existingActive.id !== id) {
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

    // Samo ažuriraj status 
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

  // Blok termini - za operacije i duže zahvate
  async createBlockAppointment(dto: CreateBlockAppointmentDto): Promise<Appointment[]> {
    const { doctorId, patientId, date, startTime, numberOfSlots, reason, notes } = dto;

    if (!patientId) {
      throw new BadRequestException('Pacijent je obavezan za blok termine (operacije/procedure)');
    }

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

    const timeSlots = this.generateTimeSlots(startTime, numberOfSlots);

    // Proveri da li su svi slotovi slobodni
    const occupiedSlots = await this.checkSlotsOccupied(doctorId, date, timeSlots);
    if (occupiedSlots.length > 0) {
      throw new BadRequestException(
        `Sledeći slotovi su već zauzeti: ${occupiedSlots.join(', ')}`
      );
    }

    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const schedule = await this.scheduleRepository.findOne({
      where: { doctorId, date: appointmentDate },
    });

    if (!schedule) {
      throw new BadRequestException(`Doktor nema definisanu smenu za datum ${date}. Admin prvo mora da kreira schedule za ovaj datum.`);
    }

    // Proveri da li su svi slotovi u okviru radnog vremena
    const shift = schedule.shift;
    const allowedSlots = getTimeSlotsByShift(shift);
    const invalidSlots = timeSlots.filter(slot => !allowedSlots.includes(slot as TimeSlot));
    
    if (invalidSlots.length > 0) {
      throw new BadRequestException(
        `Sledeći slotovi nisu u okviru radnog vremena: ${invalidSlots.join(', ')}`
      );
    }

    // Kreiraj sve termine
    const appointments: Appointment[] = [];
    for (let i = 0; i < timeSlots.length; i++) {
      const appointment = this.appointmentRepository.create({
        doctorId,
        patientId: patientId || undefined,
        date: new Date(date),
        timeSlot: timeSlots[i] as TimeSlot,
        reason,
        notes: notes || `Blok termin ${i + 1}/${numberOfSlots}`,
        status: AppointmentStatus.Approved,
      });
      appointments.push(appointment);
    }

    const savedAppointments = await this.appointmentRepository.save(appointments);

    return this.appointmentRepository.find({
      where: savedAppointments.map(apt => ({ id: apt.id })),
      relations: ['doctor', 'patient'],
    });
  }

  private generateTimeSlots(startTime: string, count: number): string[] {
    const slots: string[] = [];
    let [hours, minutes] = startTime.split(':').map(Number);
    
    for (let i = 0; i < count; i++) {
      slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
      minutes += 30;
      if (minutes >= 60) {
        hours++;
        minutes = 0;
      }
    }
    return slots;
  }

  private async checkSlotsOccupied(doctorId: string, date: string, timeSlots: string[]): Promise<string[]> {
    const occupiedSlots: string[] = [];
    
    for (const slot of timeSlots) {
      // Proveri sve aktivne statuse (ne gledamo Cancelled i Rejected)
      const existing = await this.appointmentRepository.findOne({
        where: [
          { doctorId, date: new Date(date), timeSlot: slot as TimeSlot, status: AppointmentStatus.Pending },
          { doctorId, date: new Date(date), timeSlot: slot as TimeSlot, status: AppointmentStatus.Approved },
          { doctorId, date: new Date(date), timeSlot: slot as TimeSlot, status: AppointmentStatus.Completed },
        ],
      });

      if (existing) {
        occupiedSlots.push(slot);
      }
    }

    return occupiedSlots;
  }
}
