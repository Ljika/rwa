import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Učitaj korisnika iz localStorage pri inicijalizaciji
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // FETCH API + PROMISE 
  async loginWithFetch(credentials: LoginRequest): Promise<AuthResponse> {
    
    const response = await fetch(`${environment.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log(' LOGIN: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error(' LOGIN: Greška pri logovanju:', error);
      throw new Error(error.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    console.log('LOGIN: Uspešno logovanje!', data);
    
    // Sačuvaj token i user podatke
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    this.currentUserSubject.next(data.user);

    return data;
  }

  //  FETCH API + PROMISE za registraciju
  async registerWithFetch(userData: RegisterRequest): Promise<AuthResponse> {
    
    const response = await fetch(`${environment.apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    console.log('REGISTER: Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error(' REGISTER: Greška pri registraciji:', error);
      throw new Error(error.message || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    console.log(' REGISTER: Uspešna registracija!', data);
    
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    this.currentUserSubject.next(data.user);

    return data;
  }

  // PROMISE - Load user profile
  async loadUserProfile(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${environment.apiUrl}/users/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load profile');
    }

    const user: User = await response.json();
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);

    return user;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}
