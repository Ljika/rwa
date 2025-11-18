import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user.model';
import { AddScheduleFormComponent, CreateScheduleDto } from '../add-schedule-form/add-schedule-form.component';
import { ScheduleCalendarComponent } from '../schedule-calendar/schedule-calendar.component';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, AddScheduleFormComponent, ScheduleCalendarComponent],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.scss'
})
export class DoctorListComponent {
  @Input() doctors: User[] = [];
  @Input() loading: boolean = false;
  @Input() expandedDoctorId: string | null = null;
  @Input() selectedDoctorAction: string | null = null;
  @Input() selectedDoctorId: string | null = null;
  @Input() doctorPatients: User[] = [];
  @Input() loadingDoctorPatients: boolean = false;
  @Input() doctorSchedules: any[] = [];
  @Input() loadingDoctorSchedules: boolean = false;
  @Input() selectedMonth: string = '';
  @Input() scheduleSuccessMessage: string = '';
  @Input() scheduleErrorMessage: string = '';
  
  @Output() deleteDoctor = new EventEmitter<string>();
  @Output() editDoctor = new EventEmitter<User>();
  @Output() toggleDetails = new EventEmitter<string>();
  @Output() viewPatients = new EventEmitter<string>();
  @Output() addSchedule = new EventEmitter<string>();
  @Output() viewSchedule = new EventEmitter<string>();
  @Output() submitSchedule = new EventEmitter<CreateScheduleDto>();
  @Output() closeScheduleForm = new EventEmitter<void>();
  @Output() monthChange = new EventEmitter<string>();

  onDelete(doctorId: string) {
    if (confirm('Da li ste sigurni da želite da obrišete ovog doktora?')) {
      this.deleteDoctor.emit(doctorId);
    }
  }

  onEdit(doctor: User) {
    this.editDoctor.emit(doctor);
  }

  onToggleDetails(doctorId: string) {
    this.toggleDetails.emit(doctorId);
  }

  onViewPatients(doctorId: string) {
    this.viewPatients.emit(doctorId);
  }

  onAddSchedule(doctorId: string) {
    this.addSchedule.emit(doctorId);
  }

  onViewSchedule(doctorId: string) {
    this.viewSchedule.emit(doctorId);
  }

  onSubmitSchedule(scheduleData: CreateScheduleDto) {
    this.submitSchedule.emit(scheduleData);
  }

  onCloseScheduleForm() {
    this.closeScheduleForm.emit();
  }

  getSelectedDoctorName(): string {
    if (!this.selectedDoctorId) return '';
    const doctor = this.doctors.find(d => d.id === this.selectedDoctorId);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : '';
  }
  
  onMonthChange(month: string) {
    this.monthChange.emit(month);
  }
}
