import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user.model';
import { AddScheduleFormComponent, CreateScheduleDto } from '../add-schedule-form/add-schedule-form.component';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, AddScheduleFormComponent],
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
  
  onMonthChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.monthChange.emit(select.value);
  }
  
  getShiftLabel(shift: string): string {
    switch(shift) {
      case 'Morning': return '🌅 Jutarnja (08:00-16:00)';
      case 'Afternoon': return '🌆 Popodnevna (16:00-00:00)';
      case 'Night': return '🌙 Noćna (00:00-08:00)';
      default: return shift;
    }
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  getCalendarDays(): any[] {
    if (!this.selectedMonth) return [];
    
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday...
    
    const calendarDays: any[] = [];
    
    // Add empty cells for days before the 1st of the month
    // Adjust so Monday is first day (0 = Monday, 6 = Sunday)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < adjustedStart; i++) {
      calendarDays.push({ day: null, schedule: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = this.doctorSchedules.find(s => s.date.startsWith(dateStr));
      calendarDays.push({ day, schedule });
    }
    
    return calendarDays;
  }
  
  getMonthYearLabel(): string {
    if (!this.selectedMonth) return '';
    const [year, month] = this.selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
  }
  
  getShiftClass(shift: string): string {
    switch(shift) {
      case 'Morning': return 'shift-morning';
      case 'Afternoon': return 'shift-afternoon';
      case 'Night': return 'shift-night';
      default: return '';
    }
  }
}
