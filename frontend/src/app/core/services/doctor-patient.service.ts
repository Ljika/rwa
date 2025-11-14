import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DoctorPatientLink } from '../../shared/models/doctor.model';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorPatientService {

  constructor(private http: HttpClient) { }

  // Assign patient to doctor (Admin only)
  assignPatientToDoctor(doctorId: string, patientId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${environment.apiUrl}/doctor-patient/assign`, 
      { doctorId, patientId }, 
      { headers }
    );
  }

  // PROMISE - Get my doctors (for patients)
  async getMyDoctors(): Promise<User[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${environment.apiUrl}/doctor-patient/my-doctors`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('MY DOCTORS: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('MY DOCTORS: Greška pri učitavanju:', error);
      throw new Error(error.message || 'Failed to load doctors');
    }

    const data: User[] = await response.json();
    console.log('MY DOCTORS: Uspešno učitano!', data);
    
    return data;
  }

  // PROMISE - Get my patients (for doctors)
  async getMyPatients(): Promise<User[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${environment.apiUrl}/doctor-patient/my-patients`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('MY PATIENTS: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('MY PATIENTS: Greška pri učitavanju:', error);
      throw new Error(error.message || 'Failed to load patients');
    }

    const data: User[] = await response.json();
    console.log('MY PATIENTS: Uspešno učitano!', data);
    
    return data;
  }

  // Get patients for specific doctor (Admin only)
  getDoctorPatients(doctorId: string): Observable<User[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<User[]>(`${environment.apiUrl}/doctor-patient/doctor/${doctorId}/patients`, { headers });
  }

  // Remove patient from doctor (Admin only)
  removePatientFromDoctor(doctorId: string, patientId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${environment.apiUrl}/doctor-patient/remove?doctorId=${doctorId}&patientId=${patientId}`, { headers });
  }
}
