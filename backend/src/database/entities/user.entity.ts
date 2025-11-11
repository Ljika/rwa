import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Gender } from '../../common/enums/gender.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; 

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Patient,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization: string; 

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacije:
  // Appointments gde je ovaj user Doctor
  @OneToMany('Appointment', (appointment: any) => appointment.doctor)
  appointmentsAsDoctor: any[];

  // Appointments gde je ovaj user Patient
  @OneToMany('Appointment', (appointment: any) => appointment.patient)
  appointmentsAsPatient: any[];

  // Therapies koje je ovaj Doctor prepisao
  @OneToMany('Therapy', (therapy: any) => therapy.doctor)
  therapiesAsDoctor: any[];

  // Therapies koje je ovaj Patient dobio
  @OneToMany('Therapy', (therapy: any) => therapy.patient)
  therapiesAsPatient: any[];

  // MANY-TO-MANY: Doktor <-> Pacijenti
  // Kada je User = Doctor, ovo su svi pacijenti dodeljeni njemu
  @OneToMany('DoctorPatient', (doctorPatient: any) => doctorPatient.doctor)
  doctorPatients: any[];

  // Kada je User = Patient, ovo su svi doktori dodeljeni njemu
  @OneToMany('DoctorPatient', (doctorPatient: any) => doctorPatient.patient)
  patientDoctors: any[];

  // Smene doktora (samo za role = Doctor)
  @OneToMany('DoctorSchedule', (schedule: any) => schedule.doctor)
  doctorSchedules: any[];
}
