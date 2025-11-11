import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as string;
  const user = authService.getCurrentUser();

  if (user && user.role === requiredRole) {
    return true;
  }

  // Redirect to unauthorized page ili dashboard
  router.navigate(['/unauthorized']);
  return false;
};
