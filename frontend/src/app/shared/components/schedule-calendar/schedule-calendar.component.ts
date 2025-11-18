import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss'
})
export class ScheduleCalendarComponent {
  @Input() schedules: any[] = [];
  @Input() loading: boolean = false;
  @Input() selectedMonth: string = '';
  
  @Output() monthChange = new EventEmitter<string>();

  onMonthChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.monthChange.emit(select.value);
  }
  
  getShiftLabel(shift: string): string {
    switch(shift) {
      case 'Morning': return 'Jutarnja (08:00-16:00)';
      case 'Afternoon': return 'Popodnevna (16:00-00:00)';
      case 'Night': return 'Noćna (00:00-08:00)';
      default: return shift;
    }
  }
  
  getCalendarDays(): any[] {
    if (!this.selectedMonth) return [];
    
    const [year, month] = this.selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays: any[] = [];
    
    // Adjust so Monday is first day (0 = Monday, 6 = Sunday)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < adjustedStart; i++) {
      calendarDays.push({ day: null, schedule: null });
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = this.schedules.find(s => s.date.startsWith(dateStr));
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
