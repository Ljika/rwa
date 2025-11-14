import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface Drug {
  id: string;
  name: string;
  type: string;
  dosage: string;
  description?: string;
  manufacturer?: { id: string; name: string };
}


export interface CreateDrugDto {
  name: string;
  type: string;
  dosage: string;
  description?: string;
  manufacturerId: string;
}


export interface UpdateDrugDto {
  name?: string;
  type?: string;
  dosage?: string;
  description?: string;
  manufacturerId?: string;
}

@Injectable({ providedIn: 'root' })
export class DrugsService {
  private readonly apiUrl = `${environment.apiUrl}/drugs`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Drug[]> {
    return this.http.get<Drug[]>(this.apiUrl);
  }

  create(dto: CreateDrugDto): Observable<Drug> {
    return this.http.post<Drug>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateDrugDto): Observable<Drug> {
    return this.http.patch<Drug>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
