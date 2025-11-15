import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TherapyDrugDto {
  drugId: string;
  timesPerDay: number;
  durationDays: number;
  instructions?: string;
}

export interface CreateTherapyDto {
  appointmentId: string;
  diagnosis: string;
  notes?: string;
  drugs: TherapyDrugDto[];
}

export interface Therapy {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  notes?: string;
  prescribedAt: string;
  therapyDrugs: any[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TherapiesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/therapies`;

  createTherapy(dto: CreateTherapyDto): Observable<Therapy> {
    return this.http.post<Therapy>(this.apiUrl, dto);
  }

  getMyTherapies(): Observable<Therapy[]> {
    return this.http.get<Therapy[]>(`${this.apiUrl}/my-therapies`);
  }

  getMyPrescribedTherapies(): Observable<Therapy[]> {
    return this.http.get<Therapy[]>(`${this.apiUrl}/my-prescribed-therapies`);
  }

  getAllTherapies(): Observable<Therapy[]> {
    return this.http.get<Therapy[]>(this.apiUrl);
  }

  getTherapy(id: string): Observable<Therapy> {
    return this.http.get<Therapy>(`${this.apiUrl}/${id}`);
  }

  deleteTherapy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
