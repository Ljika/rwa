import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DrugAllergy } from '../models/drug-allergy.model';

@Injectable({
  providedIn: 'root'
})
export class DrugAllergiesService {
  private apiUrl = `${environment.apiUrl}/drug-allergies`;

  constructor(private http: HttpClient) {}

  getByDrug(drugId: string): Observable<DrugAllergy[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<DrugAllergy[]>(`${this.apiUrl}/drug/${drugId}`, { headers });
  }

  create(data: { drugId: string; allergyId: string }): Observable<DrugAllergy> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<DrugAllergy>(this.apiUrl, data, { headers });
  }

  delete(id: string): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
