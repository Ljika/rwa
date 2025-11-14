import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  date: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDto {
  doctorId: string;
  date: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
}

@Injectable({
  providedIn: 'root'
})
export class DoctorSchedulesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/doctor-schedules`;

  createSchedule(dto: CreateScheduleDto): Observable<DoctorSchedule> {
    return this.http.post<DoctorSchedule>(this.apiUrl, dto);
  }

  createScheduleRange(doctorId: string, dateFrom: string, dateTo: string, shift: 'Morning' | 'Afternoon' | 'Night'): Observable<DoctorSchedule[]> {
    // Kreiraj smene za svaki dan u periodu
    const dates = this.getDateRange(dateFrom, dateTo);
    
    if (dates.length === 0) {
      return of([]);
    }
    
    const requests = dates.map(date => 
      this.http.post<DoctorSchedule>(this.apiUrl, { doctorId, date, shift })
    );
    
    // forkJoin kombinuje multiple Observable i čeka da svi završe paralelno
    return forkJoin(requests);
  }

  getDoctorSchedules(doctorId: string): Observable<DoctorSchedule[]> {
    return this.http.get<DoctorSchedule[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  getAllSchedules(): Observable<DoctorSchedule[]> {
    return this.http.get<DoctorSchedule[]>(this.apiUrl);
  }

  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
}
