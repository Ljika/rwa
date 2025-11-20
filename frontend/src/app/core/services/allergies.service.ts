import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Allergy } from '../models/allergy.model';

@Injectable({
  providedIn: 'root'
})
export class AllergiesService {
  private apiUrl = `${environment.apiUrl}/allergies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Allergy[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Allergy[]>(this.apiUrl, { headers });
  }

  getOne(id: string): Observable<Allergy> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Allergy>(`${this.apiUrl}/${id}`, { headers });
  }

  create(name: string): Observable<Allergy> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<Allergy>(this.apiUrl, { name }, { headers });
  }

  update(id: string, name: string): Observable<Allergy> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch<Allergy>(`${this.apiUrl}/${id}`, { name }, { headers });
  }

  delete(id: string): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
