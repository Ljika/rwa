import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MedicalHistory } from '../../shared/models/medical-history.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {

  constructor() { }

  // PROMISE - Get my medical history
  async getMyMedicalHistory(): Promise<MedicalHistory[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${environment.apiUrl}/medical-history/my-history`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('MEDICAL HISTORY: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('MEDICAL HISTORY: Greška pri učitavanju:', error);
      throw new Error(error.message || 'Failed to load medical history');
    }

    const data: MedicalHistory[] = await response.json();
    console.log('MEDICAL HISTORY: Uspešno učitano!', data);
    
    return data;
  }
}
