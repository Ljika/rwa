import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { DrugType } from '../enums/drug-type.enum';

@Entity('drugs')
export class Drug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: DrugType,
    default: DrugType.Tablet,
  })
  type: DrugType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string; 

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacija: Više Drugs -> Jedan Manufacturer
  @ManyToOne('Manufacturer', (manufacturer: any) => manufacturer.drugs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'manufacturerId' })
  manufacturer: any;

  @Column({ type: 'uuid', nullable: true })
  manufacturerId: string;

  // Relacija za many-to-many sa Therapy preko TherapyDrug
  @OneToMany('TherapyDrug', (therapyDrug: any) => therapyDrug.drug)
  therapyDrugs: any[];
}
