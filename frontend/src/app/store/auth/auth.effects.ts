import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import * as AuthActions from './auth.actions';
import { AuthResponse } from '../../shared/models/user.model';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private router = inject(Router);
  
  // Login Effect - koristi fetch API + Promise 
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        from(
          fetch(`${environment.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          }).then(async (response) => {
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Login failed');
            }
            return response.json();
          })
        ).pipe(
          map((data: AuthResponse) => {
            // Sačuvaj u localStorage
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            return AuthActions.loginSuccess({
              user: data.user,
              token: data.accessToken
            });
          }),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Register Effect - koristi fetch API + Promise
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ userData }) =>
        from(
          fetch(`${environment.apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          }).then(async (response) => {
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Registration failed');
            }
            return response.json();
          })
        ).pipe(
          map((data: AuthResponse) => {
            // Sačuvaj u localStorage
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            return AuthActions.registerSuccess({
              user: data.user,
              token: data.accessToken
            });
          }),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Load User Profile Effect
  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserProfile),
      switchMap(() => {
        const token = localStorage.getItem('token');
        if (!token) {
          return of(AuthActions.loadUserProfileFailure({ error: 'No token found' }));
        }

        return from(
          fetch(`${environment.apiUrl}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error('Failed to load profile');
            }
            return response.json();
          })
        ).pipe(
          map((user) => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return AuthActions.loadUserProfileSuccess({ user });
          }),
          catchError((error) =>
            of(AuthActions.loadUserProfileFailure({ error: error.message }))
          )
        );
      })
    )
  );

  // Update Profile Effect
  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateProfile),
      switchMap(({ userId, userData }) => {
        const token = localStorage.getItem('token');
        if (!token) {
          return of(AuthActions.updateProfileFailure({ error: 'No token found' }));
        }

        return from(
          fetch(`${environment.apiUrl}/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
          }).then(async (response) => {
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Update profile failed');
            }
            return response.json();
          })
        ).pipe(
          map((user) => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return AuthActions.updateProfileSuccess({ user });
          }),
          catchError((error) =>
            of(AuthActions.updateProfileFailure({ error: error.message }))
          )
        );
      })
    )
  );

  // Logout Effect - čisti localStorage
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
      })
    ),
    { dispatch: false }
  );

  // Redirect after successful login
  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ user }) => {
        // Redirektuj na osnovu role
        if (user.role === 'Patient') {
          this.router.navigate(['/patient/dashboard']);
        } else if (user.role === 'Doctor') {
          this.router.navigate(['/doctor/dashboard']);
        } else if (user.role === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        }
      })
    ),
    { dispatch: false }
  );

  // Redirect after successful registration
  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(() => {
        // Uvek redirektuj na patient dashboard (auto-assigned role)
        this.router.navigate(['/patient/dashboard']);
      })
    ),
    { dispatch: false }
  );

}
