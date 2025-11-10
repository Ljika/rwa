import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('therapy_drugs')
export class TherapyDrug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dosage: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string; 

  @Column({ type: 'text', nullable: true })
  instructions: string; 

  // Relacija: Više TherapyDrugs -> Jedna Therapy
  @ManyToOne('Therapy', (therapy: any) => therapy.therapyDrugs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'therapyId' })
  therapy: any;

  @Column({ type: 'uuid' })
  therapyId: string;

  // Relacija: Više TherapyDrugs -> Jedan Drug
  @ManyToOne('Drug', (drug: any) => drug.therapyDrugs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'drugId' })
  drug: any;

  @Column({ type: 'uuid' })
  drugId: string;
}
