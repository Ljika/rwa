import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Allergy } from './allergy.entity';

@Entity('patient_allergies')
export class PatientAllergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid' })
  allergyId: string;

  @Column({ type: 'date', nullable: true })
  diagnosedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.patientAllergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: User;

  @ManyToOne(() => Allergy, (allergy) => allergy.patientAllergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'allergyId' })
  allergy: Allergy;
}
