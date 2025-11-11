import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { TimeSlot } from '../../common/enums/time-slot.enum';

@Entity('appointments')
@Unique(['doctorId', 'date', 'timeSlot']) // Jedan doktor ne može imati 2 termina u isto vreme
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date; // Datum (bez vremena)

  @Column({
    type: 'enum',
    enum: TimeSlot,
  })
  timeSlot: TimeSlot; // Tačno vreme (08:00, 08:30, itd.)

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.Pending,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  reason: string; 

  @Column({ type: 'text', nullable: true })
  notes: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacija: Više Appointments -> Jedan Doctor (User)
  @ManyToOne('User', (user: any) => user.appointmentsAsDoctor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: any;

  @Column({ type: 'uuid' })
  doctorId: string;

  // Relacija: Više Appointments -> Jedan Patient (User)
  @ManyToOne('User', (user: any) => user.appointmentsAsPatient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: any;

  @Column({ type: 'uuid' })
  patientId: string;

  // Relacija: Jedan Appointment -> Jedna Therapy (opciono)
  @OneToOne('Therapy', (therapy: any) => therapy.appointment, {
    nullable: true,
  })
  therapy: any;
}
