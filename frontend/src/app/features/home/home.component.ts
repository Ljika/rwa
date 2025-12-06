import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { AppointmentTypesService } from '../../core/services/appointment-types.service';
import { User } from '../../shared/models/user.model';
import { AppointmentType } from '../../core/models/appointment-type.model';

interface DoctorsBySpecialization {
  [key: string]: User[];
}

interface AppointmentTypesBySpecialization {
  [key: string]: AppointmentType[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  loginForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;

  doctors$!: Observable<User[]>;
  doctorsBySpecialization$!: Observable<DoctorsBySpecialization>;
  
  appointmentTypes$!: Observable<AppointmentType[]>;
  appointmentTypesBySpecialization$!: Observable<AppointmentTypesBySpecialization>;

  showLoginForm = true; // Uvek prikazuj login formu
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usersService: UsersService,
    private appointmentTypesService: AppointmentTypesService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    this.isLoading$ = this.authService.isLoading$;
    this.error$ = this.authService.error$;
  }

  ngOnInit() {
    this.loadDoctors();
    this.loadAppointmentTypes();
  }

  loadDoctors() {
    this.doctors$ = this.usersService.getAllDoctors();
    
    this.doctorsBySpecialization$ = this.doctors$.pipe(
      map(doctors => {
        const grouped: DoctorsBySpecialization = {};
        doctors.forEach(doctor => {
          const spec = doctor.specialization || 'Ostalo';
          if (!grouped[spec]) {
            grouped[spec] = [];
          }
          grouped[spec].push(doctor);
        });
        return grouped;
      })
    );
  }

  loadAppointmentTypes() {
    this.appointmentTypes$ = this.appointmentTypesService.getAll();
    
    this.appointmentTypesBySpecialization$ = this.appointmentTypes$.pipe(
      map(types => {
        const grouped: AppointmentTypesBySpecialization = {};
        types.forEach(type => {
          const spec = type.specialization || 'Opšte';
          if (!grouped[spec]) {
            grouped[spec] = [];
          }
          grouped[spec].push(type);
        });
        return grouped;
      })
    );
  }

  scrollToLogin() {
    const loginElement = document.getElementById('login-section');
    if (loginElement) {
      loginElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    const credentials = this.loginForm.value;
    this.authService.login(credentials);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  getSpecializationKeys(obj: DoctorsBySpecialization | AppointmentTypesBySpecialization | null): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getSpecializationDisplayName(spec: string): string {
    const nameMap: {[key: string]: string} = {
      'Cardiology': 'Kardiologija',
      'Neurology': 'Neurologija',
      'Pediatrics': 'Pedijatrija',
      'Orthopedics': 'Ortopedija',
      'Dermatology': 'Dermatologija',
      'Psychiatry': 'Psihijatrija',
      'GeneralMedicine': 'Opšta Medicina',
      'Surgery': 'Hirurgija',
      'Ophthalmology': 'Oftalmologija',
      'Gynecology': 'Ginekologija'
    };
    return nameMap[spec] || spec;
  }
}
