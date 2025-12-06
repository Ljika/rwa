import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { PatientAllergiesService } from '../../../core/services/patient-allergies.service';
import { Gender, User } from '../../../shared/models/user.model';
import { BookAppointmentComponent } from '../../../shared/components/book-appointment/book-appointment.component';
import { MyAppointmentsComponent } from '../../../shared/components/my-appointments/my-appointments.component';
import { Therapy } from '../../../core/models/therapy.model';
import { PatientAllergy } from '../../../core/models/patient-allergy.model';
import { loadMyTherapies } from '../../../store/therapies/therapies.actions';
import { selectAllTherapies, selectTherapiesLoading, selectTherapiesError } from '../../../store/therapies/therapies.selectors';
import { ChatComponent } from '../../../shared/components/chat/chat.component';
import { PatientLayoutComponent } from '../../../shared/layouts/patient-layout/patient-layout.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    BookAppointmentComponent, 
    MyAppointmentsComponent, 
    ChatComponent,
    PatientLayoutComponent
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent implements OnInit {
  activeTab: string = 'karton'; 
  currentUser$: Observable<User | null>;
  isEditMode: boolean = false;
  editProfileForm: FormGroup;
  genders = Object.values(Gender);
  isUpdating$: Observable<boolean>;

  // Karton tab data
  myDoctors: any[] = [];
  myAllergies: PatientAllergy[] = [];
  isLoadingKarton: boolean = false;

  // Terapije tab data
  myTherapies$: Observable<Therapy[]>;
  isLoadingTherapies$: Observable<boolean>;
  therapiesError$: Observable<string | null>;

  constructor(
    private authService: AuthService,
    private doctorPatientService: DoctorPatientService,
    private patientAllergiesService: PatientAllergiesService,
    private fb: FormBuilder,
    private store: Store
  ) {
    // Observables iz Store-a
    this.currentUser$ = this.authService.currentUser$;
    this.isUpdating$ = this.authService.isLoading$;
    this.myTherapies$ = this.store.select(selectAllTherapies);
    this.isLoadingTherapies$ = this.store.select(selectTherapiesLoading);
    this.therapiesError$ = this.store.select(selectTherapiesError);
    
    // Inicijalizuj formu
    const currentUser = this.authService.getCurrentUser();
    
    // Inicijalizuj formu sa trenutnim podacima
    this.editProfileForm = this.fb.group({
      firstName: [currentUser?.firstName || '', Validators.required],
      lastName: [currentUser?.lastName || '', Validators.required],
      phoneNumber: [currentUser?.phoneNumber || ''],
      dateOfBirth: [currentUser?.dateOfBirth || ''],
      gender: [currentUser?.gender || '']
    });
  }

  ngOnInit() {
    // Učitaj medicinski karton i lekare odmah pri inicijalizaciji
    this.loadKartonData();
    // Učitaj terapije
    this.store.dispatch(loadMyTherapies());
  }

  selectTab(tab: string) {
    console.log('TAB CLICKED:', tab);
    this.activeTab = tab;
    
    // Refresh terapije kad se otvori tab
    if (tab === 'terapije') {
      console.log('Loading therapies for patient...');
      this.store.dispatch(loadMyTherapies());
      
      // Debug: Subscribe to check what we get
      this.myTherapies$.subscribe(therapies => {
        console.log('Therapies in store:', therapies);
      });
      
      this.isLoadingTherapies$.subscribe(loading => {
        console.log('Loading state:', loading);
      });
    }
  }

  logout() {
    this.authService.logout();
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      const currentUser = this.authService.getCurrentUser();
      // Popuni formu sa trenutnim podacima
      this.editProfileForm.patchValue({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        phoneNumber: currentUser?.phoneNumber || '',
        dateOfBirth: currentUser?.dateOfBirth || '',
        gender: currentUser?.gender || ''
      });
    }
  }

  editProfile() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.editProfileForm.patchValue({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phoneNumber: currentUser.phoneNumber,
        dateOfBirth: currentUser.dateOfBirth,
        gender: currentUser.gender
      });
      this.isEditMode = true;
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editProfileForm.reset();
  }

  saveProfile() {
    const currentUser = this.authService.getCurrentUser();
    if (this.editProfileForm.invalid || !currentUser?.id) {
      return;
    }

    const updateData = this.editProfileForm.value;
    // Dispatch update profile action
    this.authService.updateProfile(currentUser.id, updateData);
    this.isEditMode = false;
  }

  // Load Karton data
  async loadKartonData() {
    this.isLoadingKarton = true;
    
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('Korisnik nije prijavljen');
      }
      
      // Učitaj lekare
      this.myDoctors = await this.doctorPatientService.getMyDoctors();
      
      // Učitaj alergije
      this.patientAllergiesService.getByPatient(currentUser.id).subscribe({
        next: (allergies) => {
          this.myAllergies = allergies;
        },
        error: (err) => {
          console.error('Greška pri učitavanju alergija:', err);
          this.myAllergies = [];
        }
      });
    } catch (error: any) {
      console.error('Greška pri učitavanju kartona:', error);
      alert(error.message || 'Greška pri učitavanju kartona');
    } finally {
      this.isLoadingKarton = false;
    }
  }
}
