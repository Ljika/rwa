import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DoctorPatientLink } from '../../shared/models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorPatientService {

  constructor() { }

  // PROMISE - Get my doctors (for patients)
  async getMyDoctors(): Promise<DoctorPatientLink[]> {
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

    const data: DoctorPatientLink[] = await response.json();
    console.log('MY DOCTORS: Uspešno učitano!', data);
    
    return data;
  }

  // PROMISE - Get my patients (for doctors)
  async getMyPatients(): Promise<DoctorPatientLink[]> {
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

    const data: DoctorPatientLink[] = await response.json();
    console.log('MY PATIENTS: Uspešno učitano!', data);
    
    return data;
  }
}
