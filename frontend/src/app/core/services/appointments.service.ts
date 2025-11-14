import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TimeSlot } from '../../shared/models/appointment.model';

export interface CreateAppointmentDto {
  doctorId: string;
  date: string;
  timeSlot: TimeSlot;
  reason?: string;
  notes?: string;
}

export interface UpdateAppointmentStatusDto {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  timeSlot: TimeSlot;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';
  reason?: string;
  notes?: string;
  doctor?: any;
  patient?: any;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  createAppointment(dto: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, dto);
  }

  getAvailableSlots(doctorId: string, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/available-slots`, {
      params: { doctorId, date }
    });
  }

  getMyAppointmentsAsPatient(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/my-appointments`);
  }

  getMyAppointmentsAsDoctor(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/my-patients-appointments`);
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  updateAppointmentStatus(id: string, dto: UpdateAppointmentStatusDto): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, dto);
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
