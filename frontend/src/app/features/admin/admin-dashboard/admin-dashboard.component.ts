import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { DoctorSchedulesService } from '../../../core/services/doctor-schedules.service';
import { UsersService } from '../../../core/services/users.service';
import { Gender, User } from '../../../shared/models/user.model';
import { AppState } from '../../../store';
import * as UsersActions from '../../../store/users/users.actions';
import * as UsersSelectors from '../../../store/users/users.selectors';

// Import child components
import { PatientListComponent } from '../../../shared/components/patient-list/patient-list.component';
import { DoctorListComponent } from '../../../shared/components/doctor-list/doctor-list.component';
import { AdminListComponent } from '../../../shared/components/admin-list/admin-list.component';
import { DrugsService, Drug } from '../../../core/services/drugs.service';
import { ManufacturersService, Manufacturer } from '../../../core/services/manufacturers.service';
import { AddDoctorFormComponent, CreateDoctorDto } from '../../../shared/components/add-doctor-form/add-doctor-form.component';
import { AddScheduleFormComponent, CreateScheduleDto } from '../../../shared/components/add-schedule-form/add-schedule-form.component';
import { EditUserModalComponent, UpdateUserDto } from '../../../shared/components/edit-user-modal/edit-user-modal.component';
import { DrugsAdminComponent } from '../drugs-admin/drugs-admin.component';
import { ManufacturersAdminComponent } from '../manufacturers-admin/manufacturers-admin.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    PatientListComponent,
    DoctorListComponent,
    AdminListComponent,
    AddDoctorFormComponent,
    AddScheduleFormComponent,
    EditUserModalComponent,
    DrugsAdminComponent,
    ManufacturersAdminComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  showLekForm = false;
  editLek: Drug | null = null;
  lekForm!: FormGroup;

  manufacturers: Manufacturer[] = [];

  drugTypes = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Other'
  ];

  startEditLek(lek: Drug) {
    this.editLek = lek;
    this.showLekForm = true;
    this.lekForm.patchValue({
      name: lek.name,
      type: lek.type,
      dosage: lek.dosage || '',
      description: lek.description || '',
      manufacturerId: lek.manufacturer?.id || ''
    });
  }

  cancelLekForm() {
    this.showLekForm = false;
    this.editLek = null;
    this.lekForm.reset();
  }

  submitLekForm() {
    if (this.lekForm.invalid) return;
    // Ensure all values are strings for backend
    const value = {
      name: String(this.lekForm.value.name ?? ''),
      type: String(this.lekForm.value.type ?? ''),
      dosage: String(this.lekForm.value.dosage ?? ''),
      description: String(this.lekForm.value.description ?? ''),
      manufacturerId: String(this.lekForm.value.manufacturerId ?? '')
    };
    if (this.editLek) {
      this.drugsService.update(this.editLek.id, value).subscribe({
        next: () => { this.selectTab('lekovi'); this.cancelLekForm(); },
        error: () => alert('Greška pri izmeni leka')
      });
    } else {
      this.drugsService.create(value).subscribe({
        next: () => { this.selectTab('lekovi'); this.cancelLekForm(); },
        error: () => alert('Greška pri dodavanju leka')
      });
    }
  }

  deleteLek(lek: Drug) {
    if (!confirm('Da li ste sigurni da želite da obrišete lek: ' + lek.name + '?')) return;
    this.drugsService.delete(lek.id).subscribe({
      next: () => this.selectTab('lekovi'),
      error: () => alert('Greška pri brisanju leka')
    });
  }


  // Prikaz/dijalog za lekove
  onAddLek() {
    // TODO: Otvori modal/formu za dodavanje leka
    alert('Dodaj lek - forma/modal');
  }
  onEditLek(lek: any) {
    // TODO: Otvori modal/formu za izmenu leka
    alert('Izmeni lek: ' + lek.name);
  }
  onDeleteLek(lek: any) {
    // TODO: Potvrda i brisanje leka
    if (confirm('Da li ste sigurni da želite da obrišete lek: ' + lek.name + '?')) {
      alert('Obriši lek: ' + lek.name);
    }
  }
  activeTab: string = 'profil';
  currentUser$: Observable<User | null>;
  isEditMode: boolean = false;
  editProfileForm: FormGroup;
  genders = Object.values(Gender);
  isUpdating$: Observable<boolean>;
  
  // Form visibility flags (child components handle their own forms)
  showAddDoctorForm: boolean = false;
  showAddAdminForm: boolean = false;
  
  // Edit User Modal
  showEditModal: boolean = false;
  selectedUserForEdit: User | null = null;
  
  // Doctor Details Expansion
  expandedDoctorId: string | null = null;
  selectedDoctorAction: 'patients' | 'schedule' | 'add-schedule' | null = null;
  selectedDoctorId: string | null = null;
  doctorPatients: User[] = [];
  loadingDoctorPatients: boolean = false;
  doctorSchedules: any[] = [];
  loadingDoctorSchedules: boolean = false;
  selectedMonth: string = '';
  selectedYear: number = new Date().getFullYear();
  
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
  
  // RxJS tokovi za Ukloni tab - dodatni operatori
  removeDoctorSearchTerm$ = new Subject<string>();
  removePatientSearchTerm$ = new Subject<string>();
  filteredRemoveDoctors$!: Observable<User[]>;
  filteredRemovePatients$!: Observable<User[]>;
  
  // Izabrani korisnici
  selectedPatient: User | null = null;
  selectedDoctor: User | null = null;
  
  // Izabrani korisnici za Ukloni tab
  selectedRemoveDoctor: User | null = null;
  selectedRemovePatient: User | null = null;
  
  // Show dropdown state
  showPatientDropdown = false;
  showDoctorDropdown = false;
  
  // Show dropdown state za Ukloni tab
  showRemoveDoctorDropdown = false;
  showRemovePatientDropdown = false;
  
  // Add Schedule Form
  showAddScheduleForm: boolean = false;
  addScheduleForm!: FormGroup;
  isCreatingSchedule: boolean = false;
  scheduleSuccessMessage: string = '';
  scheduleErrorMessage: string = '';

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private store: Store<AppState>,
    private doctorPatientService: DoctorPatientService,
    private doctorSchedulesService: DoctorSchedulesService,
    private usersService: UsersService,
    private fb: FormBuilder,
  private drugsService: DrugsService,
  private manufacturersService: ManufacturersService
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
    // Inicijalizuj lekForm
    this.lekForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      dosage: ['', Validators.required],
      description: [''],
      manufacturerId: ['', Validators.required]
    });
    
    // Child komponente imaju svoje forme, ovde ih ne treba inicijalizovati
    
    // Setup autocomplete tokova 
    this.setupAutocomplete();
    this.setupRemoveAutocomplete();
  }

  ngOnInit() {
  // Učitaj korisnike odmah
  this.store.dispatch(UsersActions.loadUsers());
  // Učitaj proizvođače odmah
  this.manufacturersService.getAll().subscribe(manu => this.manufacturers = manu);
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

  setupRemoveAutocomplete() {
    // Autocomplete za doktore u Ukloni tabu
    this.filteredRemoveDoctors$ = this.removeDoctorSearchTerm$.pipe(
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

    // Autocomplete za pacijente - samo pacijente izabranog doktora
    // Koristimo samo search term, a doctorId uzimamo direktno iz komponente
    this.filteredRemovePatients$ = this.removePatientSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2 && !!this.selectedRemoveDoctor),
      // switchMap - otkazuje prethodni poziv i učitava pacijente doktora
      switchMap(term =>
        this.doctorPatientService.getDoctorPatients(this.selectedRemoveDoctor!.id).pipe(
          // map - filtrira pacijente po search termu
          map(patients => 
            patients.filter(p => 
              p.email.toLowerCase().startsWith(term.toLowerCase()) ||
              p.firstName.toLowerCase().startsWith(term.toLowerCase()) ||
              p.lastName.toLowerCase().startsWith(term.toLowerCase())
            )
          ),
          // catchError - hendluje greške i vraća prazan niz
          catchError(error => {
            console.error('Error loading doctor patients:', error);
            return of([]);
          })
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

  // Metode za Ukloni tab autocomplete
  onRemoveDoctorSearchChange(term: string) {
    this.removeDoctorSearchTerm$.next(term);
    this.showRemoveDoctorDropdown = term.length >= 2;
  }

  onRemovePatientSearchChange(term: string) {
    this.removePatientSearchTerm$.next(term);
    this.showRemovePatientDropdown = term.length >= 2;
  }

  selectRemoveDoctor(doctor: User) {
    this.selectedRemoveDoctor = doctor;
    this.removeDoctorSearchTerm$.next('');
    this.showRemoveDoctorDropdown = false;
    // Reset pacijenta kad se promeni doktor
    this.selectedRemovePatient = null;
  }

  selectRemovePatient(patient: User) {
    this.selectedRemovePatient = patient;
    this.removePatientSearchTerm$.next('');
    this.showRemovePatientDropdown = false;
  }

  clearRemoveDoctor() {
    this.selectedRemoveDoctor = null;
    this.showRemoveDoctorDropdown = false;
    // Resetuj i pacijenta
    this.selectedRemovePatient = null;
    this.showRemovePatientDropdown = false;
  }

  clearRemovePatient() {
    this.selectedRemovePatient = null;
    this.showRemovePatientDropdown = false;
  }

  lekovi: Drug[] = [];
  selectTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'lekovi') {
      this.drugsService.getAll().subscribe({
        next: (data) => (this.lekovi = data),
        error: () => (this.lekovi = [])
      });
      this.manufacturersService.getAll().subscribe(manu => this.manufacturers = manu);
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

  // Delete metode su zamenjene sa handler metodama u child komponentama

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

  // Remove patient from doctor
  removePatientFromDoctor() {
    if (!this.selectedRemovePatient || !this.selectedRemoveDoctor) {
      alert('Morate izabrati i doktora i pacijenta!');
      return;
    }

    const doctorName = `Dr. ${this.selectedRemoveDoctor.firstName} ${this.selectedRemoveDoctor.lastName}`;
    const patientName = `${this.selectedRemovePatient.firstName} ${this.selectedRemovePatient.lastName}`;

    if (!confirm(`Da li ste sigurni da želite da uklonite pacijenta ${patientName} od doktora ${doctorName}?`)) {
      return;
    }

    this.doctorPatientService
      .removePatientFromDoctor(this.selectedRemoveDoctor.id, this.selectedRemovePatient.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          alert(`Uspešno uklonjen pacijent ${patientName} od doktora ${doctorName}`);
          // Reset forme
          this.selectedRemovePatient = null;
          this.selectedRemoveDoctor = null;
        },
        error: (error) => {
          console.error('Error removing patient from doctor:', error);
          alert(error.error?.message || 'Greška pri uklanjanju pacijenta od doktora');
        }
      });
  }

  // Toggle methods za forme
  toggleAddDoctorForm() {
    this.showAddDoctorForm = !this.showAddDoctorForm;
  }

  toggleAddAdminForm() {
    this.showAddAdminForm = !this.showAddAdminForm;
  }

  // Helper methods za modal
  openEditModal(user: User) {
    this.selectedUserForEdit = user;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUserForEdit = null;
  }

  // Doctor Details Methods
  toggleDoctorDetails(doctorId: string) {
    if (this.expandedDoctorId === doctorId) {
      // Zatvori ako je već otvoren
      this.expandedDoctorId = null;
      this.selectedDoctorAction = null;
      this.selectedDoctorId = null;
      this.doctorPatients = [];
    } else {
      // Otvori novi
      this.expandedDoctorId = doctorId;
      this.selectedDoctorAction = null;
      this.selectedDoctorId = null;
      this.doctorPatients = [];
    }
  }

  viewDoctorPatients(doctorId: string) {
    this.selectedDoctorAction = 'patients';
    this.selectedDoctorId = doctorId;
    this.loadingDoctorPatients = true;

    this.doctorPatientService.getDoctorPatients(doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients: User[]) => {
          this.doctorPatients = patients;
          this.loadingDoctorPatients = false;
          console.log('Doctor patients loaded:', patients);
        },
        error: (error: any) => {
          console.error('Error loading doctor patients:', error);
          alert('Greška pri učitavanju pacijenata');
          this.loadingDoctorPatients = false;
        }
      });
  }

  // Helper methods za schedule form i doctor expansion
  openAddScheduleForm(doctorId: string) {
    this.selectedDoctorAction = 'add-schedule';
    this.selectedDoctorId = doctorId;
    this.scheduleSuccessMessage = '';
    this.scheduleErrorMessage = '';
  }

  closeScheduleForm() {
    this.scheduleSuccessMessage = '';
    this.scheduleErrorMessage = '';
  }

  viewDoctorSchedule(doctorId: string) {
    this.selectedDoctorAction = 'schedule';
    this.selectedDoctorId = doctorId;
    this.loadingDoctorSchedules = true;
    
    // Default to current month if not selected
    if (!this.selectedMonth) {
      const now = new Date();
      this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    this.loadDoctorSchedulesForMonth(doctorId, this.selectedMonth);
  }
  
  loadDoctorSchedulesForMonth(doctorId: string, yearMonth: string) {
    this.loadingDoctorSchedules = true;
    const [year, month] = yearMonth.split('-');
    
    this.doctorSchedulesService.getDoctorSchedules(doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedules: any[]) => {
          // Filter schedules by selected month
          this.doctorSchedules = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate.getFullYear() === parseInt(year) && 
                   scheduleDate.getMonth() + 1 === parseInt(month);
          });
          this.loadingDoctorSchedules = false;
        },
        error: (error: any) => {
          console.error('Error loading schedules:', error);
          alert('Greška pri učitavanju smena');
          this.loadingDoctorSchedules = false;
        }
      });
  }
  
  onMonthChange(yearMonth: string) {
    this.selectedMonth = yearMonth;
    if (this.selectedDoctorId) {
      this.loadDoctorSchedulesForMonth(this.selectedDoctorId, yearMonth);
    }
  }

  // ========== CHILD COMPONENT EVENT HANDLERS ==========
  // Handler metode koje primaju evente od child komponenti

  // PatientListComponent handlers
  handleDeletePatient(patientId: string) {
    this.usersService.deleteUser(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Pacijent uspešno obrisan!');
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: (error: any) => {
          console.error('Error deleting patient:', error);
          alert('Greška pri brisanju pacijenta');
        }
      });
  }

  handleEditPatient(patient: User) {
    this.openEditModal(patient);
  }

  // DoctorListComponent handlers
  handleDeleteDoctor(doctorId: string) {
    this.usersService.deleteUser(doctorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Doktor uspešno obrisan!');
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: (error: any) => {
          console.error('Error deleting doctor:', error);
          alert('Greška pri brisanju doktora');
        }
      });
  }

  handleEditDoctor(doctor: User) {
    this.openEditModal(doctor);
  }

  handleToggleDoctorDetails(doctorId: string) {
    this.toggleDoctorDetails(doctorId);
  }

  handleViewDoctorPatients(doctorId: string) {
    this.viewDoctorPatients(doctorId);
  }

  handleAddDoctorSchedule(doctorId: string) {
    this.openAddScheduleForm(doctorId);
  }

  handleViewDoctorSchedule(doctorId: string) {
    this.viewDoctorSchedule(doctorId);
  }

  // AdminListComponent handlers
  handleDeleteAdmin(adminId: string) {
    this.usersService.deleteUser(adminId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Administrator uspešno obrisan!');
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: (error: any) => {
          console.error('Error deleting admin:', error);
          alert('Greška pri brisanju administratora');
        }
      });
  }

  handleEditAdmin(admin: User) {
    this.openEditModal(admin);
  }

  // AddDoctorFormComponent handlers
  handleSubmitDoctorForm(doctorData: CreateDoctorDto) {
    const data = {
      ...doctorData,
      role: 'Doctor'
    };

    this.usersService.createDoctor(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert(`Uspešno kreiran doktor: ${doctorData.firstName} ${doctorData.lastName}`);
          this.showAddDoctorForm = false;
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: (error: any) => {
          console.error('Error creating doctor:', error);
          alert(error.error?.message || 'Greška pri kreiranju doktora');
        }
      });
  }

  handleCancelDoctorForm() {
    this.showAddDoctorForm = false;
  }

  // AddScheduleFormComponent handlers  
  handleSubmitSchedule(scheduleData: CreateScheduleDto) {
    console.log('Creating schedule with data:', scheduleData);
    this.isCreatingSchedule = true;
    this.scheduleErrorMessage = '';
    this.scheduleSuccessMessage = '';

    this.doctorSchedulesService.createScheduleRange(
      scheduleData.doctorId,
      scheduleData.dateFrom,
      scheduleData.dateTo,
      scheduleData.shift
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedules) => {
          this.scheduleSuccessMessage = `Uspešno kreirano ${schedules.length} smena!`;
          this.isCreatingSchedule = false;
          
          setTimeout(() => {
            this.closeScheduleForm();
            this.selectedDoctorAction = null;
          }, 2000);
        },
        error: (error: any) => {
          this.scheduleErrorMessage = error.error?.message || 'Greška pri kreiranju smena';
          this.isCreatingSchedule = false;
        }
      });
  }

  handleCancelScheduleForm() {
    this.closeScheduleForm();
    this.selectedDoctorAction = null;
  }

  // EditUserModalComponent handlers
  handleSaveUser(userData: UpdateUserDto) {
    const { id, ...updatePayload } = userData; // Remove id from body
    
    this.usersService.updateUser(id, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert(`Uspešno ažuriran korisnik: ${userData.firstName} ${userData.lastName}`);
          this.closeEditModal();
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: (error: any) => {
          console.error('Error updating user:', error);
          alert(error.error?.message || 'Greška pri ažuriranju korisnika');
        }
      });
  }

  handleCloseEditModal() {
    this.closeEditModal();
  }
}
