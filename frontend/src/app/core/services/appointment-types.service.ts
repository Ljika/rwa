import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppointmentType } from '../models/appointment-type.model';
import { Specialization } from '../../common/enums/specialization.enum';

@Injectable({
  providedIn: 'root'
})
export class AppointmentTypesService {
  private apiUrl = `${environment.apiUrl}/appointment-types`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppointmentType[]> {
    return this.http.get<AppointmentType[]>(this.apiUrl);
  }

  getBySpecialization(specialization: Specialization): Observable<AppointmentType[]> {
    return this.http.get<AppointmentType[]>(`${this.apiUrl}/by-specialization/${specialization}`);
  }

  getOne(id: string): Observable<AppointmentType> {
    return this.http.get<AppointmentType>(`${this.apiUrl}/${id}`);
  }

  create(appointmentType: Partial<AppointmentType>): Observable<AppointmentType> {
    return this.http.post<AppointmentType>(this.apiUrl, appointmentType);
  }

  update(id: string, appointmentType: Partial<AppointmentType>): Observable<AppointmentType> {
    return this.http.patch<AppointmentType>(`${this.apiUrl}/${id}`, appointmentType);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
