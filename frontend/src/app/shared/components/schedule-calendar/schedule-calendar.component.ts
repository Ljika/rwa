import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss'
})
export class ScheduleCalendarComponent implements OnInit, OnChanges {
  @Input() schedules: any[] = [];
  @Input() selectedMonth: string = '';
  @Output() monthChange = new EventEmitter<string>();

  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  
  daysInMonth: any[] = [];
  
  weekDays = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
  
  monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 
                'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

  ngOnInit(): void {
    console.log('Calendar ngOnInit - selectedMonth:', this.selectedMonth, 'schedules:', this.schedules);
    // Set current month from selectedMonth input if provided
    if (this.selectedMonth) {
      const [year, month] = this.selectedMonth.split('-');
      this.currentYear = parseInt(year);
      this.currentMonth = parseInt(month) - 1;
    }
    this.generateCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Calendar ngOnChanges:', changes);
    if (changes['schedules'] || changes['selectedMonth']) {
      if (this.selectedMonth) {
        const [year, month] = this.selectedMonth.split('-');
        this.currentYear = parseInt(year);
        this.currentMonth = parseInt(month) - 1;
      }
      this.generateCalendar();
    }
  }

  generateCalendar(): void {
    console.log('Generating calendar for:', this.currentYear, this.currentMonth, 'schedules count:', this.schedules.length);
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    const daysInCurrentMonth = lastDay.getDate();
    
    this.daysInMonth = [];
    
    for (let i = 0; i < startDay; i++) {
      this.daysInMonth.push({ day: null, shift: null });
    }
    
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = this.schedules.find(s => s.date === dateStr);
      
      if (schedule) {
        console.log('Found schedule for', dateStr, ':', schedule);
      }
      
      this.daysInMonth.push({
        day: day,
        shift: schedule ? schedule.shift : null,
        date: dateStr
      });
    }
    console.log('Calendar generated, daysInMonth:', this.daysInMonth.length, 'days with shifts:', this.daysInMonth.filter(d => d.shift).length);
  }

  getShiftClass(shift: string | null): string {
    if (!shift) return '';
    
    switch(shift) {
      case 'Morning':
        return 'shift-morning';
      case 'Afternoon':
        return 'shift-afternoon';
      case 'Night':
        return 'shift-night';
      default:
        return '';
    }
  }

  getShiftLabel(shift: string | null): string {
    if (!shift) return '';
    
    switch(shift) {
      case 'Morning':
        return 'J';
      case 'Afternoon':
        return 'P';
      case 'Night':
        return 'N';
      default:
        return '';
    }
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    const newMonth = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    console.log('Previous month clicked, emitting:', newMonth);
    this.monthChange.emit(newMonth);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    const newMonth = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
    console.log('Next month clicked, emitting:', newMonth);
    this.monthChange.emit(newMonth);
    this.generateCalendar();
  }
}
