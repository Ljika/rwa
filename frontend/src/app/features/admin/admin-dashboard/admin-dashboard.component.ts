import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { Gender, User } from '../../../shared/models/user.model';
import { AppState } from '../../../store';
import * as UsersActions from '../../../store/users/users.actions';
import * as UsersSelectors from '../../../store/users/users.selectors';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeTab: string = 'profil';
  currentUser$: Observable<User | null>;
  isEditMode: boolean = false;
  editProfileForm: FormGroup;
  genders = Object.values(Gender);
  isUpdating$: Observable<boolean>;
  
  // Observables iz Store-a 
  patients$: Observable<User[]>;
  doctors$: Observable<User[]>;
  admins$: Observable<User[]>;
  isLoadingUsers$: Observable<boolean>;

  // RxJS tokovi za autocomplete 
  patientSearchTerm$ = new Subject<string>();
  doctorSearchTerm$ = new Subject<string>();
  filteredPatients$!: Observable<User[]>;
  filteredDoctors$!: Observable<User[]>;
  
  // Izabrani korisnici
  selectedPatient: User | null = null;
  selectedDoctor: User | null = null;
  
  // Show dropdown state
  showPatientDropdown = false;
  showDoctorDropdown = false;
  
  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private store: Store<AppState>,
    private doctorPatientService: DoctorPatientService,
    private fb: FormBuilder
  ) {
    // Observables iz Store-a
    this.currentUser$ = this.authService.currentUser$;
    this.isUpdating$ = this.authService.isLoading$;
    
    // Selektori iz Store-a 
    this.patients$ = this.store.select(UsersSelectors.selectPatients);
    this.doctors$ = this.store.select(UsersSelectors.selectDoctors);
    this.admins$ = this.store.select(UsersSelectors.selectAdmins);
    this.isLoadingUsers$ = this.store.select(UsersSelectors.selectUsersLoading);
    
    // Inicijalizuj formu
    const currentUser = this.authService.getCurrentUser();
    
    this.editProfileForm = this.fb.group({
      firstName: [currentUser?.firstName || '', Validators.required],
      lastName: [currentUser?.lastName || '', Validators.required],
      phoneNumber: [currentUser?.phoneNumber || ''],
      dateOfBirth: [currentUser?.dateOfBirth || ''],
      gender: [currentUser?.gender || '']
    });
    
    // Setup autocomplete tokova 
    this.setupAutocomplete();
  }

  ngOnInit() {
    // Učitaj korisnike odmah
    this.store.dispatch(UsersActions.loadUsers());
  }

  ngOnDestroy() {
    // Cleanup subscriptions 
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupAutocomplete() {
    // Autocomplete za pacijente - debounceTime, distinctUntilChanged, filter, switchMap
    this.filteredPatients$ = this.patientSearchTerm$.pipe(
      debounceTime(300),                          // Čeka 300ms da prestaneš da kucaš
      distinctUntilChanged(),                      // Samo ako se promenio tekst
      filter(term => term.length >= 2),           // Minimum 2 karaktera
      switchMap(term =>                           // switchMap - otkazuje prethodni poziv
        this.patients$.pipe(
          map(patients => 
            patients.filter(p => 
              p.email.toLowerCase().startsWith(term.toLowerCase()) ||
              p.firstName.toLowerCase().startsWith(term.toLowerCase()) ||
              p.lastName.toLowerCase().startsWith(term.toLowerCase())
            )
          )
        )
      ),
      takeUntil(this.destroy$)                    // Auto unsubscribe
    );

    // Autocomplete za doktore
    this.filteredDoctors$ = this.doctorSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap(term =>
        this.doctors$.pipe(
          map(doctors => 
            doctors.filter(d => 
              d.email.toLowerCase().startsWith(term.toLowerCase()) ||
              d.firstName.toLowerCase().startsWith(term.toLowerCase()) ||
              d.lastName.toLowerCase().startsWith(term.toLowerCase())
            )
          )
        )
      ),
      takeUntil(this.destroy$)
    );
  }

  // Metode za autocomplete
  onPatientSearchChange(term: string) {
    this.patientSearchTerm$.next(term);
    this.showPatientDropdown = term.length >= 2;
  }

  onDoctorSearchChange(term: string) {
    this.doctorSearchTerm$.next(term);
    this.showDoctorDropdown = term.length >= 2;
  }

  selectPatient(patient: User) {
    this.selectedPatient = patient;
    this.patientSearchTerm$.next(''); // Resetuj pretragu
    this.showPatientDropdown = false;
  }

  selectDoctor(doctor: User) {
    this.selectedDoctor = doctor;
    this.doctorSearchTerm$.next(''); // Resetuj pretragu
    this.showDoctorDropdown = false;
  }

  clearPatient() {
    this.selectedPatient = null;
    this.showPatientDropdown = false;
  }

  clearDoctor() {
    this.selectedDoctor = null;
    this.showDoctorDropdown = false;
  }

  selectTab(tab: string) {
    this.activeTab = tab;
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

  // Delete metodama samo dispatchujemo akciju 
  deletePatient(patientId: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog pacijenta?')) {
      return;
    }
    
    // Dispatch akciju - Effects će se pobrinuti za API poziv
    this.store.dispatch(UsersActions.deleteUser({ userId: patientId }));
  }

  deleteDoctor(doctorId: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog doktora?')) {
      return;
    }
    
    // Dispatch akciju - Effects će se pobrinuti za API poziv
    this.store.dispatch(UsersActions.deleteUser({ userId: doctorId }));
  }

  deleteAdmin(adminId: string) {
    if (!confirm('Da li ste sigurni da želite da obrišete ovog administratora?')) {
      return;
    }
    
    // Dispatch akciju - Effects će se pobrinuti za API poziv
    this.store.dispatch(UsersActions.deleteUser({ userId: adminId }));
  }

  // Assign doctor to patient
  assignDoctorToPatient() {
    if (!this.selectedPatient || !this.selectedDoctor) {
      alert('Morate izabrati i pacijenta i doktora!');
      return;
    }

    this.doctorPatientService
      .assignPatientToDoctor(this.selectedDoctor.id, this.selectedPatient.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          alert(`Uspešno dodeljen Dr. ${this.selectedDoctor!.firstName} ${this.selectedDoctor!.lastName} pacijentu ${this.selectedPatient!.firstName} ${this.selectedPatient!.lastName}`);
          // Reset forme
          this.selectedPatient = null;
          this.selectedDoctor = null;
        },
        error: (error) => {
          console.error('Error assigning doctor to patient:', error);
          alert(error.error?.message || 'Greška pri dodeli lekara pacijentu');
        }
      });
  }
}
