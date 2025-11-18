import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/auth/auth.actions';
import * as AuthSelectors from '../../store/auth/auth.selectors';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const store = inject(Store);
  const token = authService.getToken();

  // Dodaj Authorization header ako postoji token
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ako je 401 Unauthorized (token expired)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          console.log('Token expired, attempting refresh...');
          
          // Dispatch refresh action
          store.dispatch(AuthActions.refreshToken({ refreshToken }));

          // Sačekaj da se refresh završi i ponovi zahtev
          return store.select(AuthSelectors.selectToken).pipe(
            filter(newToken => !!newToken && newToken !== token), // Čekaj novi token
            take(1),
            switchMap(newToken => {
              console.log('Token refreshed, retrying request...');
              
              // Ponovi original zahtev sa novim tokenom
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });

              return next(clonedReq);
            }),
            catchError((refreshError) => {
              console.error('Refresh failed, logging out...');
              // Refresh token takođe istekao → Logout
              store.dispatch(AuthActions.logout());
              return throwError(() => refreshError);
            })
          );
        } else {
          // Nema refresh tokena → Logout
          console.log('No refresh token, logging out...');
          store.dispatch(AuthActions.logout());
        }
      }

      return throwError(() => error);
    })
  );
};
