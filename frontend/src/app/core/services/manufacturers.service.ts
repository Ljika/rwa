import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Manufacturer {
  id: string;
  name: string;
  country?: string;
  contactEmail?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateManufacturerDto {
  name: string;
}

export interface UpdateManufacturerDto {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ManufacturersService {
  private readonly apiUrl = `${environment.apiUrl}/manufacturers`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Manufacturer[]> {
    return this.http.get<Manufacturer[]>(this.apiUrl);
  }

  create(dto: CreateManufacturerDto): Observable<Manufacturer> {
    return this.http.post<Manufacturer>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateManufacturerDto): Observable<Manufacturer> {
    return this.http.patch<Manufacturer>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
