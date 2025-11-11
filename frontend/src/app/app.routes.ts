import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  // Patient routes
  {
    path: 'patient/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { role: 'Patient' },
    loadComponent: () => import('./features/patient/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent)
  },
  
  // TODO: Admin routes
  // TODO: Doctor routes
  
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];
