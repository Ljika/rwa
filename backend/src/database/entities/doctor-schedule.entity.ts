import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shift } from '../../common/enums/shift.enum';

@Entity('doctor_schedules')
@Unique(['doctorId', 'date'])
export class DoctorSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  doctorId: string;

  @Column({ type: 'date' })
  date: Date; 
  @Column({
    type: 'enum',
    enum: Shift,
  })
  shift: Shift;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacija: Više DoctorSchedules -> Jedan Doctor (User)
  @ManyToOne('User', (user: any) => user.doctorSchedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: any;
}
