import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientAllergy } from '../models/patient-allergy.model';

@Injectable({
  providedIn: 'root'
})
export class PatientAllergiesService {
  private apiUrl = `${environment.apiUrl}/patient-allergies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PatientAllergy[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<PatientAllergy[]>(this.apiUrl, { headers });
  }

  getByPatient(patientId: string): Observable<PatientAllergy[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<PatientAllergy[]>(`${this.apiUrl}/patient/${patientId}`, { headers });
  }

  create(data: { patientId: string; allergyId: string; diagnosedDate?: string }): Observable<PatientAllergy> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<PatientAllergy>(this.apiUrl, data, { headers });
  }

  delete(id: string): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
