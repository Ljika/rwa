import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity('therapies')
export class Therapy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  diagnosis: string; 

  @Column({ type: 'text', nullable: true })
  notes: string; 

  @Column({ type: 'datetime' })
  prescribedAt: Date; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacija: Više Therapies -> Jedan Patient (User)
  @ManyToOne('User', (user: any) => user.therapiesAsPatient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patientId' })
  patient: any;

  @Column({ type: 'uuid' })
  patientId: string;

  // Relacija: Više Therapies -> Jedan Doctor (User)
  @ManyToOne('User', (user: any) => user.therapiesAsDoctor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: any;

  @Column({ type: 'uuid' })
  doctorId: string;

  // Relacija: Jedna Therapy -> Jedan Appointment (opciono)
  @OneToOne('Appointment', (appointment: any) => appointment.therapy, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: any;

  @Column({ type: 'uuid', nullable: true, unique: true })
  appointmentId: string; 
  
  // Relacija za many-to-many sa Drug preko TherapyDrug
  @OneToMany('TherapyDrug', (therapyDrug: any) => therapyDrug.therapy)
  therapyDrugs: any[];
}
