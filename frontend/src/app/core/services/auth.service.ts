import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { LoginRequest, RegisterRequest, UpdateUserRequest, User } from '../../shared/models/user.model';
import * as AuthActions from '../../store/auth/auth.actions';
import * as AuthSelectors from '../../store/auth/auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Observables iz Store-a umesto BehaviorSubject
  public currentUser$: Observable<User | null>;
  public isAuthenticated$: Observable<boolean>;
  public isLoading$: Observable<boolean>;
  public error$: Observable<string | null>;

  constructor(private store: Store) {
    // Selektori iz Store-a
    this.currentUser$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
    this.isLoading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
    
    // Učitaj korisnika iz localStorage pri inicijalizaciji (ako postoji token)
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      this.store.dispatch(AuthActions.loginSuccess({ user, token: storedToken }));
    }
  }

  // Dispatch login action - Effects će se pobrinuti za fetch API
  login(credentials: LoginRequest): void {
    this.store.dispatch(AuthActions.login({ credentials }));
  }

  // Dispatch register action - Effects će se pobrinuti za fetch API
  register(userData: RegisterRequest): void {
    this.store.dispatch(AuthActions.register({ userData }));
  }

  // Dispatch load profile action
  loadUserProfile(): void {
    this.store.dispatch(AuthActions.loadUserProfile());
  }

  // Dispatch logout action
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
  
  // Update profile
  updateProfile(userId: string, userData: UpdateUserRequest): void {
    this.store.dispatch(AuthActions.updateProfile({ userId, userData }));
  }

  // Helper methods - sada koriste localStorage direktno
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }
}
