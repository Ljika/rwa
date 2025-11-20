import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Drug } from './drug.entity';
import { Allergy } from './allergy.entity';

@Entity('drug_allergies')
export class DrugAllergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  drugId: string;

  @Column({ type: 'uuid' })
  allergyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Drug, (drug) => drug.drugAllergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drugId' })
  drug: Drug;

  @ManyToOne(() => Allergy, (allergy) => allergy.drugAllergies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'allergyId' })
  allergy: Allergy;
}
