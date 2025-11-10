import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('doctor_patients')
export class DoctorPatient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIJA: Više DoctorPatients -> Jedan Doctor (User sa role=Doctor)
  @ManyToOne('User', (user: any) => user.doctorPatients)
  @JoinColumn({ name: 'doctorId' })
  doctor: any;

  @Column({ type: 'uuid' })
  doctorId: string;

  // RELACIJA: Više DoctorPatients -> Jedan Patient (User sa role=Patient)
  @ManyToOne('User', (user: any) => user.patientDoctors)
  @JoinColumn({ name: 'patientId' })
  patient: any;

  @Column({ type: 'uuid' })
  patientId: string;

  @CreateDateColumn()
  assignedAt: Date; 
}
