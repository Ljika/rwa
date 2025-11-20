import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PatientAllergy } from './patient-allergy.entity';
import { DrugAllergy } from './drug-allergy.entity';

@Entity('allergies')
export class Allergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => PatientAllergy, (patientAllergy) => patientAllergy.allergy)
  patientAllergies: PatientAllergy[];

  @OneToMany(() => DrugAllergy, (drugAllergy) => drugAllergy.allergy)
  drugAllergies: DrugAllergy[];
}
