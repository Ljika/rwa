import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, of, BehaviorSubject, combineLatest, from, zip } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, catchError, reduce, mergeMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { DoctorSchedulesService } from '../../../core/services/doctor-schedules.service';
import { UsersService } from '../../../core/services/users.service';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { Gender, User } from '../../../shared/models/user.model';
import { AppState } from '../../../store';
import * as UsersActions from '../../../store/users/users.actions';
import * as UsersSelectors from '../../../store/users/users.selectors';
import * as AllergiesActions from '../../../store/allergies/allergies.actions';
import { selectAllAllergies, selectAllergiesLoading, selectAllergiesError } from '../../../store/allergies/allergies.selectors';
import { Allergy } from '../../../core/models/allergy.model';
import { PatientAllergy } from '../../../core/models/patient-allergy.model';
import { PatientAllergiesService } from '../../../core/services/patient-allergies.service';
import * as AppointmentTypesActions from '../../../store/appointment-types/appointment-types.actions';
import { selectAllAppointmentTypes, selectAppointmentTypesLoading, selectAppointmentTypesError } from '../../../store/appointment-types/appointment-types.selectors';
import { AppointmentType } from '../../../core/models/appointment-type.model';
import { Specialization } from '../../../common/enums/specialization.enum';

// Import child components
import { PatientListComponent } from '../../../shared/components/patient-list/patient-list.component';
import { DoctorListComponent } from '../../../shared/components/doctor-list/doctor-list.component';
import { AdminListComponent } from '../../../shared/components/admin-list/admin-list.component';
import { DrugsService, Drug } from '../../../core/services/drugs.service';
import { ManufacturersService, Manufacturer } from '../../../core/services/manufacturers.service';
import { AddDoctorFormComponent, CreateDoctorDto } from '../../../shared/components/add-doctor-form/add-doctor-form.component';
import { AddAdminFormComponent, CreateAdminDto } from '../../../shared/components/add-admin-form/add-admin-form.component';
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
    FormsModule,
    PatientListComponent,
    DoctorListComponent,
    AdminListComponent,
    AddDoctorFormComponent,
    AddAdminFormComponent,
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

  isLoadingAllAppointments: boolean = false;
  
  // Cleanup Subject - mora biti definisan PRE filteredAppointments$
  private destroy$ = new Subject<void>();
  
  public allAppointments$ = new BehaviorSubject<any[]>([]);
  private dateFromFilter$ = new BehaviorSubject<string>('');
  private dateToFilter$ = new BehaviorSubject<string>('');
  private doctorFilter$ = new BehaviorSubject<string>('');
  private patientFilter$ = new BehaviorSubject<string>('');
  private statusFilter$ = new BehaviorSubject<string>('');

  // combineLatest kombinuje sve filtere i emituje kad se BILO KOJI promeni
  filteredAppointments$: Observable<any[]> = combineLatest([
    this.allAppointments$,
    this.dateFromFilter$,
    this.dateToFilter$,
    this.doctorFilter$,
    this.patientFilter$,
    this.statusFilter$
  ]).pipe(
    map(([appointments, dateFrom, dateTo, doctorId, patientId, status]) => {
      console.log('combineLatest emitted! Filters:', { dateFrom, dateTo, doctorId, patientId, status });
      
      // Prvo grupiši blok termine
      const groupedAppointments = this.groupBlockAppointments(appointments);
      
      // Zatim filtriraj
      return groupedAppointments.filter(apt => {
        // Date range filter
        let matchesDateRange = true;
        if (dateFrom && dateTo) {
          matchesDateRange = apt.date >= dateFrom && apt.date <= dateTo;
        } else if (dateFrom) {
          matchesDateRange = apt.date >= dateFrom;
        } else if (dateTo) {
          matchesDateRange = apt.date <= dateTo;
        }
        
        const matchesDoctor = !doctorId || apt.doctorId === doctorId;
        const matchesPatient = !patientId || apt.patientId === patientId;
        const matchesStatus = !status || apt.status === status;
        return matchesDateRange && matchesDoctor && matchesPatient && matchesStatus;
      });
    }),
    takeUntil(this.destroy$)
  );

  // Getter-i za two-way binding u template-u
  get appointmentDateFromFilter(): string {
    return this.dateFromFilter$.value;
  }
  set appointmentDateFromFilter(value: string) {
    this.dateFromFilter$.next(value);
  }

  get appointmentDateToFilter(): string {
    return this.dateToFilter$.value;
  }
  set appointmentDateToFilter(value: string) {
    this.dateToFilter$.next(value);
  }

  get appointmentDoctorFilter(): string {
    return this.doctorFilter$.value;
  }
  set appointmentDoctorFilter(value: string) {
    this.doctorFilter$.next(value);
  }

  get appointmentPatientFilter(): string {
    return this.patientFilter$.value;
  }
  set appointmentPatientFilter(value: string) {
    this.patientFilter$.next(value);
  }

  get appointmentStatusFilter(): string {
    return this.statusFilter$.value;
  }
  set appointmentStatusFilter(value: string) {
    this.statusFilter$.next(value);
  }

  // Metoda za resetovanje filtera
  resetAppointmentFilters() {
    this.dateFromFilter$.next('');
    this.dateToFilter$.next('');
    this.doctorFilter$.next('');
    this.patientFilter$.next('');
    this.statusFilter$.next('');
  }

  // REDUCE operator za statistiku - izračunava broj termina po statusu
  appointmentStats$: Observable<{status: string, count: number, percentage: number}[]> = 
    this.allAppointments$.pipe(
      switchMap(appointments => {
        if (appointments.length === 0) {
          return of([]);
        }
        
        return from(appointments).pipe(
          reduce((acc, appointment) => {
            const status = appointment.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          map(statusCounts => {
            const total = appointments.length;
            return Object.entries(statusCounts).map(([status, count]) => ({
              status,
              count,
              percentage: Math.round((count / total) * 100)
            }));
          })
        );
      }),
      takeUntil(this.destroy$)
    );

  filteredAppointmentsCount$: Observable<number> = this.filteredAppointments$.pipe(
    map(appointments => {
      console.log('reduce - counting appointments:', appointments.length);
      return appointments.length;
    })
  );

  totalAppointmentsCount$: Observable<number> = this.allAppointments$.pipe(
    map(appointments => {
      console.log('reduce - total appointments:', appointments.length);
      return appointments.length;
    })
  );

  // Grupišanje blok termina (uzastopni termini sa istim reason i patientId)
  groupBlockAppointments(appointments: any[]): any[] {
    if (!appointments || appointments.length === 0) return [];
    
    // Sortiraj po datumu i vremenu
    const sorted = [...appointments].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.timeSlot || a.startTime || '';
      const timeB = b.timeSlot || b.startTime || '';
      return timeA.localeCompare(timeB);
    });

    const grouped: any[] = [];
    let currentBlock: any[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      
      if (currentBlock.length === 0) {
        currentBlock.push(current);
        continue;
      }

      const last = currentBlock[currentBlock.length - 1];
      const isSameDoctor = current.doctorId === last.doctorId;
      // Ako oba nemaju pacijenta ili imaju istog
      const isSamePatient = (current.patientId === last.patientId) || 
                           (!current.patientId && !last.patientId) ||
                           (current.patientId === null && last.patientId === null);
      const isSameReason = current.reason?.trim() === last.reason?.trim();
      const isSameDate = current.date === last.date;
      const lastTime = last.timeSlot || last.startTime;
      const currentTime = current.timeSlot || current.startTime;
      const isConsecutive = this.isConsecutiveTime(lastTime, currentTime);

      console.log('Comparing appointments:', {
        current: current.id,
        last: last.id,
        isSameDoctor,
        isSamePatient,
        isSameReason,
        isSameDate,
        isConsecutive,
        currentReason: current.reason,
        lastReason: last.reason
      });

      if (isSameDoctor && isSamePatient && isSameReason && isSameDate && isConsecutive) {
        // Dodaj u trenutni blok
        console.log('Adding to block');
        currentBlock.push(current);
      } else {
        // Završi trenutni blok i započni novi
        console.log('Creating new block, current block size:', currentBlock.length);
        grouped.push(this.createGroupedAppointment(currentBlock));
        currentBlock = [current];
      }
    }

    // Dodaj poslednji blok
    if (currentBlock.length > 0) {
      grouped.push(this.createGroupedAppointment(currentBlock));
    }

    return grouped;
  }

  isConsecutiveTime(time1: string, time2: string): boolean {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes2 - minutes1 === 30; // 30 minuta razlike
  }

  createGroupedAppointment(block: any[]): any {
    if (block.length === 1) {
      // Obični termin - dodaj startTime property za prikaz
      return {
        ...block[0],
        startTime: block[0].timeSlot || block[0].startTime
      };
    }

    // Blok termin - kombinuj podatke
    const first = block[0];
    const last = block[block.length - 1];
    const lastTimeStr = last.timeSlot || last.startTime;
    const [lastH, lastM] = lastTimeStr.split(':').map(Number);
    const endMinutes = lastH * 60 + lastM + 30;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    return {
      ...first,
      startTime: first.timeSlot || first.startTime,
      endTime: endTime,
      isBlockAppointment: true,
      blockSize: block.length,
      duration: block.length * 30, // minuta
      appointmentIds: block.map(a => a.id)
    };
  }

  constructor(
    private authService: AuthService,
    private store: Store<AppState>,
    private doctorPatientService: DoctorPatientService,
    private doctorSchedulesService: DoctorSchedulesService,
    private usersService: UsersService,
    private fb: FormBuilder,
    private drugsService: DrugsService,
    private manufacturersService: ManufacturersService,
    private appointmentsService: AppointmentsService,
    private patientAllergiesService: PatientAllergiesService
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

    // Inicijalizuj allergyForm
    this.allergyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Inicijalizuj patientAllergyForm
    this.patientAllergyForm = this.fb.group({
      patientId: ['', Validators.required],
      allergyId: ['', Validators.required],
      diagnosedDate: ['']
    });

    // Allergies Store selektori
    this.allergies$ = this.store.select(selectAllAllergies);
    this.isLoadingAllergies$ = this.store.select(selectAllergiesLoading);
    this.allergiesError$ = this.store.select(selectAllergiesError);

    // AppointmentTypes Store selektori
    this.appointmentTypes$ = this.store.select(selectAllAppointmentTypes);
    this.isLoadingAppointmentTypes$ = this.store.select(selectAppointmentTypesLoading);
    this.appointmentTypesError$ = this.store.select(selectAppointmentTypesError);
        
    // Setup autocomplete tokova 
    this.setupAutocomplete();
    this.setupRemoveAutocomplete();
  }

  ngOnInit() {
  // Učitaj korisnike, alergije i tipove pregleda odmah
  this.store.dispatch(UsersActions.loadUsers());
  this.store.dispatch(AllergiesActions.loadAllergies());
  this.store.dispatch(AppointmentTypesActions.loadAppointmentTypes());
  
  zip(
    this.store.select(UsersSelectors.selectAllUsers).pipe(take(1)),
    this.manufacturersService.getAll().pipe(take(1))
  ).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: ([users, manufacturers]) => {
      console.log('zip: Inicijalni podaci učitani - korisnici i proizvođači');
      console.log(`Učitano ${users.length} korisnika i ${manufacturers.length} proizvođača`);
      this.manufacturers = manufacturers;
    },
    error: (error) => {
      console.error('Greška pri inicijalnom učitavanju podataka:', error);
    }
  });
  }

  loadAllAppointments() {
    this.isLoadingAllAppointments = true;
    this.appointmentsService.getAllAppointments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          console.log('Raw appointments from API:', appointments);
          // Emituj u BehaviorSubject - combineLatest će automatski reagovati!
          this.allAppointments$.next(appointments);
          this.isLoadingAllAppointments = false;
          console.log('Appointments loaded and emitted to allAppointments$');
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.isLoadingAllAppointments = false;
        }
      });
  }

  openAddAllergyModal() {
    this.allergyModalMode = 'add';
    this.selectedAllergyForEdit = null;
    this.allergyForm.reset();
    this.showAllergyModal = true;
  }

  openEditAllergyModal(allergy: Allergy) {
    this.allergyModalMode = 'edit';
    this.selectedAllergyForEdit = allergy;
    this.allergyForm.patchValue({ name: allergy.name });
    this.showAllergyModal = true;
  }

  closeAllergyModal() {
    this.showAllergyModal = false;
    this.allergyForm.reset();
    this.selectedAllergyForEdit = null;
  }

  submitAllergyForm() {
    if (this.allergyForm.invalid) return;

    this.isSubmittingAllergy = true;
    const name = this.allergyForm.value.name.trim();

    if (this.allergyModalMode === 'add') {
      this.store.dispatch(AllergiesActions.addAllergy({ name }));
    } else if (this.selectedAllergyForEdit) {
      this.store.dispatch(AllergiesActions.updateAllergy({ 
        id: this.selectedAllergyForEdit.id, 
        name 
      }));
    }

    // Sačekaj malo pa zatvori modal (daj vremena Store-u)
    setTimeout(() => {
      this.isSubmittingAllergy = false;
      this.closeAllergyModal();
    }, 500);
  }

  deleteAllergy(id: string, name: string) {
    if (!confirm(`Da li ste sigurni da želite da obrišete alergiju "${name}"?`)) return;
    this.store.dispatch(AllergiesActions.deleteAllergy({ id }));
  }

  onPatientSelected(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedPatientId = select.value;
    
    if (!this.selectedPatientId) {
      this.selectedPatientAllergies = [];
      this.selectedPatientName = '';
      return;
    }

    this.patients$.pipe(take(1)).subscribe(patients => {
      const patient = patients.find(p => p.id === this.selectedPatientId);
      this.selectedPatientName = patient ? `${patient.firstName} ${patient.lastName}` : '';
    });

    this.loadPatientAllergies(this.selectedPatientId);
  }

  loadPatientAllergies(patientId: string) {
    this.isLoadingPatientAllergies = true;
    this.patientAllergiesService.getByPatient(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allergies) => {
          this.selectedPatientAllergies = allergies;
          this.isLoadingPatientAllergies = false;
        },
        error: (err) => {
          console.error('Greška pri učitavanju alergija pacijenta:', err);
          alert('Greška pri učitavanju alergija pacijenta');
          this.isLoadingPatientAllergies = false;
        }
      });
  }

  addPatientAllergy() {
    if (this.patientAllergyForm.invalid) {
      this.patientAllergyForm.markAllAsTouched();
      return;
    }

    this.isAddingPatientAllergy = true;
    const data = {
      patientId: this.patientAllergyForm.value.patientId,
      allergyId: this.patientAllergyForm.value.allergyId,
      diagnosedDate: this.patientAllergyForm.value.diagnosedDate || undefined
    };

    this.patientAllergiesService.create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Alergija uspešno dodata pacijentu!');
          this.patientAllergyForm.patchValue({ allergyId: '', diagnosedDate: '' });
          this.loadPatientAllergies(data.patientId);
          this.isAddingPatientAllergy = false;
        },
        error: (err) => {
          console.error('Greška pri dodavanju alergije:', err);
          alert(err.error?.message || 'Greška pri dodavanju alergije pacijentu');
          this.isAddingPatientAllergy = false;
        }
      });
  }

  removePatientAllergy(id: string) {
    if (!confirm('Da li ste sigurni da želite da uklonite ovu alergiju pacijentu?')) return;

    this.patientAllergiesService.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Alergija uspešno uklonjena!');
          this.loadPatientAllergies(this.selectedPatientId);
        },
        error: (err) => {
          console.error('Greška pri uklanjanju alergije:', err);
          alert('Greška pri uklanjanju alergije');
        }
      });
  }


  openAddAppointmentTypeModal() {
    this.appointmentTypeModalMode = 'add';
    this.selectedAppointmentTypeForEdit = null;
    this.showAppointmentTypeModal = true;
    this.appointmentTypeForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      specialization: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      durationMinutes: [30, [Validators.required]]
    });
  }

  openEditAppointmentTypeModal(appointmentType: AppointmentType) {
    this.appointmentTypeModalMode = 'edit';
    this.selectedAppointmentTypeForEdit = appointmentType;
    this.showAppointmentTypeModal = true;
    this.appointmentTypeForm = this.fb.group({
      name: [appointmentType.name, [Validators.required]],
      description: [appointmentType.description || ''],
      specialization: [appointmentType.specialization, [Validators.required]],
      price: [appointmentType.price, [Validators.required, Validators.min(0)]],
      durationMinutes: [appointmentType.durationMinutes, [Validators.required]]
    });
  }

  closeAppointmentTypeModal() {
    this.showAppointmentTypeModal = false;
    this.selectedAppointmentTypeForEdit = null;
    this.appointmentTypeForm.reset();
  }

  submitAppointmentTypeForm() {
    if (this.appointmentTypeForm.invalid) {
      alert('Molimo popunite sva obavezna polja ispravno');
      return;
    }

    this.isSubmittingAppointmentType = true;
    const rawFormData = this.appointmentTypeForm.value;
    
    // Konvertuj tipove i očisti podatke
    const formData: any = {
      name: rawFormData.name,
      specialization: rawFormData.specialization,
      price: Number(rawFormData.price),
      durationMinutes: Number(rawFormData.durationMinutes)
    };
    
    // Dodaj description samo ako nije prazan
    if (rawFormData.description && rawFormData.description.trim()) {
      formData.description = rawFormData.description.trim();
    }

    if (this.appointmentTypeModalMode === 'add') {
      this.store.dispatch(AppointmentTypesActions.createAppointmentType({ appointmentType: formData }));
    } else if (this.selectedAppointmentTypeForEdit) {
      this.store.dispatch(AppointmentTypesActions.updateAppointmentType({ 
        id: this.selectedAppointmentTypeForEdit.id, 
        changes: formData 
      }));
    }

    // Čekaj malo pa zatvori modal
    setTimeout(() => {
      this.isSubmittingAppointmentType = false;
      this.closeAppointmentTypeModal();
    }, 500);
  }

  deactivateAppointmentType(id: string, name: string) {
    if (!confirm(`Da li ste sigurni da želite da deaktivirate tip pregleda "${name}"?`)) return;
    
    this.store.dispatch(AppointmentTypesActions.updateAppointmentType({ 
      id, 
      changes: { isActive: false } 
    }));
  }

  activateAppointmentType(id: string, name: string) {
    if (!confirm(`Da li ste sigurni da želite da aktivirate tip pregleda "${name}"?`)) return;
    
    this.store.dispatch(AppointmentTypesActions.updateAppointmentType({ 
      id, 
      changes: { isActive: true } 
    }));
  }


  ngOnDestroy() {
    // Cleanup subscriptions 
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupAutocomplete() {
    // Autocomplete za pacijente - debounceTime, distinctUntilChanged, filter, switchMap
    this.filteredPatients$ = this.patientSearchTerm$.pipe(
      debounceTime(300),                          
      distinctUntilChanged(),                      
      filter(term => term.length >= 2),           
      switchMap(term =>                           
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
    this.filteredRemovePatients$ = this.removePatientSearchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2 && !!this.selectedRemoveDoctor),
      // switchMap - otkazuje prethodni poziv i učitava pacijente doktora
      switchMap(term =>
        this.doctorPatientService.getDoctorPatients(this.selectedRemoveDoctor!.id).pipe(
          map(patients => 
            patients.filter(p => 
              p.email.toLowerCase().startsWith(term.toLowerCase()) ||
              p.firstName.toLowerCase().startsWith(term.toLowerCase()) ||
              p.lastName.toLowerCase().startsWith(term.toLowerCase())
            )
          ),
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
    } else if (tab === 'termini') {
      this.loadAllAppointments();
      this.loadUsersForBlockAppointment(); // Učitaj doktore i pacijente za filtere
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
    // Filter out empty optional fields
    const cleanedData: any = {
      firstName: doctorData.firstName,
      lastName: doctorData.lastName,
      email: doctorData.email,
      password: doctorData.password,
      specialization: doctorData.specialization,
      role: 'Doctor'
    };

    if (doctorData.phoneNumber) cleanedData.phoneNumber = doctorData.phoneNumber;
    if (doctorData.dateOfBirth) cleanedData.dateOfBirth = doctorData.dateOfBirth;
    if (doctorData.gender) cleanedData.gender = doctorData.gender;

    this.usersService.createDoctor(cleanedData)
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

  // AddAdminFormComponent handlers
  handleSubmitAdminForm(adminData: CreateAdminDto) {
    // Filter out empty optional fields
    const cleanedData: any = {
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: adminData.password,
      role: 'Admin'
    };

    if (adminData.phoneNumber) cleanedData.phoneNumber = adminData.phoneNumber;
    if (adminData.dateOfBirth) cleanedData.dateOfBirth = adminData.dateOfBirth;
    if (adminData.gender) cleanedData.gender = adminData.gender;

    this.usersService.createAdmin(cleanedData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert(`Uspešno kreiran administrator: ${adminData.firstName} ${adminData.lastName}`);
          this.showAddAdminForm = false;
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: (error: any) => {
          console.error('Error creating admin:', error);
          alert(error.error?.message || 'Greška pri kreiranju administratora');
        }
      });
  }

  handleCancelAdminForm() {
    this.showAddAdminForm = false;
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

  // Blok termini - za operacije
  showBlockAppointmentModal: boolean = false;
  blockAppointmentForm!: FormGroup;
  isSubmittingBlockAppointment: boolean = false;
  allDoctorsForBlock$!: Observable<User[]>;
  allPatientsForBlock$!: Observable<User[]>;
  availableStartTimes: string[] = [];
  isLoadingStartTimes: boolean = false;

  // Alergije - CRUD i Patient Allergies
  allergies$!: Observable<Allergy[]>;
  isLoadingAllergies$!: Observable<boolean>;
  allergiesError$!: Observable<string | null>;
  showAllergyModal: boolean = false;
  allergyModalMode: 'add' | 'edit' = 'add';
  allergyForm!: FormGroup;
  selectedAllergyForEdit: Allergy | null = null;
  isSubmittingAllergy: boolean = false;
  
  // Patient Allergies
  patientAllergyForm!: FormGroup;
  isAddingPatientAllergy: boolean = false;
  selectedPatientId: string = '';
  selectedPatientName: string = '';
  selectedPatientAllergies: PatientAllergy[] = [];
  isLoadingPatientAllergies: boolean = false;

  // Appointment Types - CRUD
  appointmentTypes$!: Observable<AppointmentType[]>;
  isLoadingAppointmentTypes$!: Observable<boolean>;
  appointmentTypesError$!: Observable<string | null>;
  showAppointmentTypeModal: boolean = false;
  appointmentTypeModalMode: 'add' | 'edit' = 'add';
  appointmentTypeForm!: FormGroup;
  selectedAppointmentTypeForEdit: AppointmentType | null = null;
  isSubmittingAppointmentType: boolean = false;
  specializations = Object.values(Specialization);

  openBlockAppointmentModal() {
    this.showBlockAppointmentModal = true;
    this.initializeBlockAppointmentForm();
    this.loadUsersForBlockAppointment();
    this.setupBlockFormListeners();
  }

  closeBlockAppointmentModal() {
    this.showBlockAppointmentModal = false;
    this.blockAppointmentForm.reset();
    this.availableStartTimes = [];
  }

  initializeBlockAppointmentForm() {
    const today = new Date().toISOString().split('T')[0];
    this.blockAppointmentForm = this.fb.group({
      doctorId: ['', Validators.required],
      patientId: [''],
      date: [today, Validators.required],
      startTime: ['', Validators.required],
      numberOfSlots: [8, [Validators.required, Validators.min(1), Validators.max(16)]],
      reason: ['OPERACIJA', Validators.required],
      notes: ['']
    });
  }

  setupBlockFormListeners() {
    // Kada se promeni doktor ili datum, učitaj slobodne slotove
    this.blockAppointmentForm.get('doctorId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAvailableStartTimes());

    this.blockAppointmentForm.get('date')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAvailableStartTimes());
  }

  loadAvailableStartTimes() {
    const doctorId = this.blockAppointmentForm.get('doctorId')?.value;
    const date = this.blockAppointmentForm.get('date')?.value;

    if (!doctorId || !date) {
      this.availableStartTimes = [];
      return;
    }

    this.isLoadingStartTimes = true;
    this.appointmentsService.getAvailableSlots(doctorId, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots: any[]) => {
          this.availableStartTimes = slots;
          this.isLoadingStartTimes = false;
          
          // Ako ima slobodnih slotova, postavi prvi kao default
          if (slots.length > 0) {
            this.blockAppointmentForm.patchValue({ startTime: slots[0] });
          } else {
            this.blockAppointmentForm.patchValue({ startTime: '' });
          }
        },
        error: (err: any) => {
          console.error('Greška pri učitavanju slobodnih slotova:', err);
          this.availableStartTimes = [];
          this.isLoadingStartTimes = false;
        }
      });
  }

  loadUsersForBlockAppointment() {
    this.allDoctorsForBlock$ = this.store.select(UsersSelectors.selectAllUsers).pipe(
      map(users => users.filter(u => u.role === 'Doctor' && u.isActive))
    );
    this.allPatientsForBlock$ = this.store.select(UsersSelectors.selectAllUsers).pipe(
      map(users => users.filter(u => u.role === 'Patient' && u.isActive))
    );
  }

  submitBlockAppointment() {
    if (this.blockAppointmentForm.invalid) {
      alert('Molimo popunite sva obavezna polja');
      return;
    }

    this.isSubmittingBlockAppointment = true;
    const formData = this.blockAppointmentForm.value;

    console.log('Šaljem blok termin:', formData);

    this.appointmentsService.createBlockAppointment(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments: any[]) => {
          this.isSubmittingBlockAppointment = false;
          alert(`Uspešno kreiran blok termin sa ${appointments.length} slotova!`);
          this.closeBlockAppointmentModal();
        },
        error: (err: any) => {
          this.isSubmittingBlockAppointment = false;
          console.error('Greška pri kreiranju blok termina:', err);
          console.error('Backend error details:', err.error);
          const errorMsg = err.error?.message || err.error?.error || 'Greška pri kreiranju blok termina';
          alert(errorMsg);
        }
      });
  }
}
