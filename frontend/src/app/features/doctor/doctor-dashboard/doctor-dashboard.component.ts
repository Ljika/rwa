import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil, BehaviorSubject, combineLatest, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { DoctorSchedulesService } from '../../../core/services/doctor-schedules.service';
import { Gender, User } from '../../../shared/models/user.model';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { TherapiesService } from '../../../core/services/therapies.service';
import { UsersService } from '../../../core/services/users.service';
import { ScheduleCalendarComponent } from '../../../shared/components/schedule-calendar/schedule-calendar.component';
import { FilterByDatePipe } from './filter-by-date.pipe';
import { selectAllDrugs } from '../../../store/drugs/drugs.selectors';
import { loadDrugs } from '../../../store/drugs/drugs.actions';
import { Drug } from '../../../core/models/drug.model';
import { addTherapy } from '../../../store/therapies/therapies.actions';
import { ChatComponent } from '../../../shared/components/chat/chat.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ScheduleCalendarComponent, FilterByDatePipe, ChatComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  cancelAppointment(id: string) {
    if (!confirm('Da li ste sigurni da želite da otkažete ovaj termin?')) return;
    this.appointmentsService.updateAppointmentStatus(id, { status: 'Cancelled' }).subscribe({
      next: () => this.loadMyAppointments(),
      error: (err: any) => alert('Greška pri otkazivanju termina')
    });
  }
  private destroy$ = new Subject<void>();
  activeTab: string = 'profil';
  currentUser$: Observable<User | null>;
  isEditMode: boolean = false;
  editProfileForm: FormGroup;
  genders = Object.values(Gender);
  isUpdating$: Observable<boolean>;

  // Pacijenti tab data
  myPatients: any[] = [];
  isLoadingPatients: boolean = false;
  
  // Patient details modal
  showPatientDetailsModal: boolean = false;
  selectedPatient: any = null;
  patientAppointmentsWithTherapies: any[] = [];
  isLoadingPatientDetails: boolean = false;
  
  // Smene tab data
  mySchedules: any[] = [];
  isLoadingSchedules: boolean = false;
  selectedMonth: string = '';

  // Termini tab data
  myAppointments: any[] = [];
  isLoadingAppointments: boolean = false;
  
  // Reactive filters
  private dateFromFilter$ = new BehaviorSubject<string>('');
  private dateToFilter$ = new BehaviorSubject<string>('');
  private statusFilter$ = new BehaviorSubject<string>('');
  private patientFilter$ = new BehaviorSubject<string>('');
  
  allAppointments$!: Observable<any[]>;
  filteredAppointments$!: Observable<any[]>;
  
  // For template
  appointmentDateFromFilter: string = '';
  appointmentDateToFilter: string = '';
  appointmentStatusFilter: string = '';
  appointmentPatientFilter: string = '';
  
  get pendingAppointments() {
    return this.myAppointments.filter(a => a.status === 'Pending');
  }
  selectedScheduledDate: string = '';
  get scheduledAppointments() {
    return this.myAppointments.filter(a => a.status === 'Approved' || a.status === 'Completed');
  }

  onScheduledDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedScheduledDate = input.value;
  }

  // Therapy modal data
  showTherapyModal: boolean = false;
  selectedAppointmentForTherapy: any = null;
  therapyForm!: FormGroup;
  allDrugs$: Observable<Drug[]>;
  isSubmittingTherapy: boolean = false;

  // Follow-up appointment modal data
  showFollowUpModal: boolean = false;
  selectedAppointmentForFollowUp: any = null;
  followUpForm!: FormGroup;
  isSubmittingFollowUp: boolean = false;
  minFollowUpDate: string = '';
  availableTimeSlots: string[] = [];
  isLoadingTimeSlots: boolean = false;
  
  // Blok termini - za operacije i duže zahvate
  showBlockAppointmentModal: boolean = false;
  blockAppointmentForm!: FormGroup;
  isSubmittingBlockAppointment: boolean = false;
  availableStartTimes: string[] = [];
  isLoadingStartTimes: boolean = false;
  allPatients: User[] = [];  
  constructor(
    private authService: AuthService,
    private doctorPatientService: DoctorPatientService,
    private doctorSchedulesService: DoctorSchedulesService,
    private appointmentsService: AppointmentsService,
    private therapiesService: TherapiesService,
    private fb: FormBuilder,
    private store: Store,
    private usersService: UsersService
  ) {
    // Observables iz Store-a
    this.currentUser$ = this.authService.currentUser$;
    this.isUpdating$ = this.authService.isLoading$;
    this.allDrugs$ = this.store.select(selectAllDrugs);
    
    // Inicijalizuj formu
    const currentUser = this.authService.getCurrentUser();
    
    this.editProfileForm = this.fb.group({
      firstName: [currentUser?.firstName || '', Validators.required],
      lastName: [currentUser?.lastName || '', Validators.required],
      phoneNumber: [currentUser?.phoneNumber || ''],
      dateOfBirth: [currentUser?.dateOfBirth || ''],
      gender: [currentUser?.gender || ''],
      specialization: [{value: currentUser?.specialization || '', disabled: true}]
    });

    // Inicijalizuj therapy formu
    this.therapyForm = this.fb.group({
      diagnosis: ['', Validators.required],
      notes: [''],
      drugs: this.fb.array([], Validators.required)
    });

    // Inicijalizuj follow-up formu
    this.followUpForm = this.fb.group({
      date: ['', Validators.required],
      timeSlot: ['', Validators.required],
      reason: [''],
      notes: ['']
    });

    // Postavi minimum datum za kontrolni pregled (sutra)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minFollowUpDate = tomorrow.toISOString().split('T')[0];
  }

  ngOnInit() {
    // Učitaj pacijente odmah
    this.loadMyPatients();
    
    // Set default month to current month
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Učitaj termine za doktora
    this.loadMyAppointments();
    
    // Setup reactive filtering
    this.setupAppointmentFiltering();

    // Učitaj lekove iz store-a
    this.store.dispatch(loadDrugs());
  }
  
  setupAppointmentFiltering() {
    this.allAppointments$ = new BehaviorSubject<any[]>(this.myAppointments);
    
    this.filteredAppointments$ = combineLatest([
      this.allAppointments$,
      this.dateFromFilter$,
      this.dateToFilter$,
      this.statusFilter$,
      this.patientFilter$
    ]).pipe(
      map(([appointments, dateFrom, dateTo, status, patient]) => {
        console.log('combineLatest emitted! Filters:', { dateFrom, dateTo, status, patient });
        const groupedAppointments = this.groupBlockAppointments(appointments);
        
        return groupedAppointments.filter(apt => {
          // Datum od filter
          let matchesDateRange = true;
          if (dateFrom && dateTo) {
            matchesDateRange = apt.date >= dateFrom && apt.date <= dateTo;
          } else if (dateFrom) {
            matchesDateRange = apt.date >= dateFrom;
          } else if (dateTo) {
            matchesDateRange = apt.date <= dateTo;
          }
          
          // Status filter
          const matchesStatus = !status || apt.status === status;
          
          // Patient filter
          const matchesPatient = !patient || apt.patientId === patient;
          
          return matchesDateRange && matchesStatus && matchesPatient;
        });
      })
    );
  }
  
  private groupBlockAppointments(appointments: any[]): any[] {
    if (!appointments || appointments.length === 0) return [];
    
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
      const isSamePatient = (current.patientId === last.patientId) || 
                           (!current.patientId && !last.patientId) ||
                           (current.patientId === null && last.patientId === null);
      const isSameReason = current.reason?.trim() === last.reason?.trim();
      const isSameDate = current.date === last.date;
      const lastTime = last.timeSlot || last.startTime;
      const currentTime = current.timeSlot || current.startTime;
      const isConsecutive = this.isConsecutiveTime(lastTime, currentTime);

      console.log('Comparing appointments:', {
        currentTime,
        lastTime,
        currentReason: current.reason,
        lastReason: last.reason,
        isSamePatient,
        isSameReason,
        isSameDate,
        isConsecutive
      });

      if (isSamePatient && isSameReason && isSameDate && isConsecutive) {
        console.log('Adding to block, block size:', currentBlock.length + 1);
        currentBlock.push(current);
      } else {
        console.log('Creating new block, current block size:', currentBlock.length);
        grouped.push(this.createGroupedAppointment(currentBlock));
        currentBlock = [current];
      }
    }

    if (currentBlock.length > 0) {
      grouped.push(this.createGroupedAppointment(currentBlock));
    }

    return grouped;
  }

  private isConsecutiveTime(time1: string, time2: string): boolean {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes2 - minutes1 === 30; // 30 minuta razlike
  }

  private createGroupedAppointment(block: any[]): any {
    if (block.length === 1) {
      return {
        ...block[0],
        isBlockAppointment: false,
        startTime: block[0].timeSlot || block[0].startTime
      };
    }

    const first = block[0];
    const last = block[block.length - 1];
    const lastTimeStr = last.timeSlot || last.startTime;
    const [lastH, lastM] = lastTimeStr.split(':').map(Number);
    const endMinutes = lastH * 60 + lastM + 30;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    return {
      ...first,
      isBlockAppointment: true,
      startTime: first.timeSlot || first.startTime,
      endTime: endTime,
      duration: block.length * 30, // minuta
      blockSize: block.length,
      appointmentIds: block.map(a => a.id)
    };
  }
  
  // Filter setters
  set appointmentDateFrom(value: string) {
    this.appointmentDateFromFilter = value;
    this.dateFromFilter$.next(value);
  }
  
  set appointmentDateTo(value: string) {
    this.appointmentDateToFilter = value;
    this.dateToFilter$.next(value);
  }
  
  set appointmentStatus(value: string) {
    this.appointmentStatusFilter = value;
    this.statusFilter$.next(value);
  }
  
  set appointmentPatient(value: string) {
    this.appointmentPatientFilter = value;
    this.patientFilter$.next(value);
  }
  
  resetAppointmentFilters() {
    this.appointmentDateFromFilter = '';
    this.appointmentDateToFilter = '';
    this.appointmentStatusFilter = '';
    this.appointmentPatientFilter = '';
    this.dateFromFilter$.next('');
    this.dateToFilter$.next('');
    this.statusFilter$.next('');
    this.patientFilter$.next('');
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(tab: string) {
    this.activeTab = tab;
    
    // Učitaj podatke za tab ako je potrebno
    if (tab === 'pacijenti' && this.myPatients.length === 0) {
      this.loadMyPatients();
    }
    
    if (tab === 'smene') {
      this.loadMySchedules();
    }
    if (tab === 'termini') {
      this.loadMyAppointments();
    }
  }

  // Load My Patients
  async loadMyPatients() {
    this.isLoadingPatients = true;
    
    try {
      this.myPatients = await this.doctorPatientService.getMyPatients();
    } catch (error: any) {
      console.error('Greška pri učitavanju pacijenata:', error);
      alert(error.message || 'Greška pri učitavanju pacijenata');
    } finally {
      this.isLoadingPatients = false;
    }
  }

  async loadAllPatientsForBlockAppointment() {
    this.usersService.getAllPatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (patients) => {
          this.allPatients = patients; 
        },
        error: (error) => {
          console.error('Greška pri učitavanju svih pacijenata:', error);
          alert(error.message || 'Greška pri učitavanju svih pacijenata');
        }
      });
  }
  
  // Load My Schedules
  loadMySchedules() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;
    
    this.isLoadingSchedules = true;
    
    this.doctorSchedulesService.getDoctorSchedules(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedules: any[]) => {
          // Filter by selected month
          if (this.selectedMonth) {
            const [year, month] = this.selectedMonth.split('-');
            this.mySchedules = schedules.filter(schedule => {
              const scheduleDate = new Date(schedule.date);
              return scheduleDate.getFullYear() === parseInt(year) && 
                     scheduleDate.getMonth() + 1 === parseInt(month);
            });
          } else {
            this.mySchedules = schedules;
          }
          this.isLoadingSchedules = false;
        },
        error: (error: any) => {
          console.error('Greška pri učitavanju smena:', error);
          alert('Greška pri učitavanju smena');
          this.isLoadingSchedules = false;
        }
      });
  }
  
  onMonthChange(yearMonth: string) {
    this.selectedMonth = yearMonth;
    this.loadMySchedules();
  }

  // Termini - učitavanje
  loadMyAppointments() {
    this.isLoadingAppointments = true;
    this.appointmentsService.getMyAppointmentsAsDoctor().subscribe({
      next: (appointments: any[]) => {
        this.myAppointments = appointments;
        
        // Emituj u BehaviorSubject za reactive filtering
        if (this.allAppointments$) {
          (this.allAppointments$ as BehaviorSubject<any[]>).next(appointments);
        }
        
        this.isLoadingAppointments = false;
      },
      error: (err: any) => {
        console.error('Greška pri učitavanju termina:', err);
        this.isLoadingAppointments = false;
      }
    });
  }

  // Termini - odobri
  approveAppointment(id: string) {
    this.appointmentsService.updateAppointmentStatus(id, { status: 'Approved' }).subscribe({
      next: () => this.loadMyAppointments(),
      error: (err: any) => alert('Greška pri odobravanju termina')
    });
  }


  // Termini - odbij
  rejectAppointment(id: string) {
    this.appointmentsService.updateAppointmentStatus(id, { status: 'Rejected' }).subscribe({
      next: () => this.loadMyAppointments(),
      error: (err: any) => alert('Greška pri odbijanju termina')
    });
  }

  // Termini - završi pregled
  finishAppointment(id: string) {
    this.appointmentsService.updateAppointmentStatus(id, { status: 'Completed' }).subscribe({
      next: () => this.loadMyAppointments(),
      error: (err: any) => alert('Greška pri završavanju pregleda')
    });
  }

  // Therapy modal methods
  openTherapyModal(appointment: any) {
    this.selectedAppointmentForTherapy = appointment;
    this.showTherapyModal = true;
    this.therapyForm.reset();
    this.drugsArray.clear();
    this.addDrugRow(); // Dodaj jedan prazan red za početak
  }

  closeTherapyModal() {
    this.showTherapyModal = false;
    this.selectedAppointmentForTherapy = null;
    this.therapyForm.reset();
    this.drugsArray.clear();
  }

  get drugsArray(): FormArray {
    return this.therapyForm.get('drugs') as FormArray;
  }

  addDrugRow() {
    const drugGroup = this.fb.group({
      drugId: ['', Validators.required],
      timesPerDay: [1, [Validators.required, Validators.min(1)]],
      durationDays: [7, [Validators.required, Validators.min(1)]],
      instructions: ['']
    });
    this.drugsArray.push(drugGroup);
  }

  removeDrugRow(index: number) {
    this.drugsArray.removeAt(index);
  }

  submitTherapy() {
    if (this.therapyForm.invalid) {
      alert('Molimo popunite sva obavezna polja');
      return;
    }

    if (!this.selectedAppointmentForTherapy) {
      alert('Termin nije izabran');
      return;
    }

    this.isSubmittingTherapy = true;

    const therapyData = {
      appointmentId: this.selectedAppointmentForTherapy.id,
      diagnosis: this.therapyForm.value.diagnosis,
      notes: this.therapyForm.value.notes || '',
      drugs: this.therapyForm.value.drugs
    };

    // Create therapy via HTTP service
    this.therapiesService.createTherapy(therapyData).subscribe({
      next: (therapy) => {
        this.isSubmittingTherapy = false;
        alert('Terapija uspešno dodata!');
        this.closeTherapyModal();
        this.loadMyAppointments();
      },
      error: (err: any) => {
        this.isSubmittingTherapy = false;
        console.error('Greška pri dodavanju terapije:', err);
        alert(err.error?.message || 'Greška pri dodavanju terapije');
      }
    });
  }

  // Patient details methods
  viewPatientDetails(patient: any) {
    this.selectedPatient = patient;
    this.showPatientDetailsModal = true;
    this.loadPatientAppointmentsWithTherapies(patient.id);
  }

  closePatientDetailsModal() {
    this.showPatientDetailsModal = false;
    this.selectedPatient = null;
    this.patientAppointmentsWithTherapies = [];
  }

  loadPatientAppointmentsWithTherapies(patientId: string) {
    this.isLoadingPatientDetails = true;
    
    // Prvo učitaj sve završene preglede za pacijenta
    this.appointmentsService.getMyAppointmentsAsDoctor()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          const completedAppointments = appointments.filter(
            app => app.patientId === patientId && app.status === 'Completed'
          );

          // Zatim učitaj sve terapije
          this.therapiesService.getMyPrescribedTherapies()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (therapies) => {
                // Spoji preglede sa terapijama
                this.patientAppointmentsWithTherapies = completedAppointments.map(appointment => {
                  // Nađi terapiju za ovaj pregled
                  const therapy = therapies.find(t => t.appointmentId === appointment.id);
                  
                  return {
                    ...appointment,
                    therapy: therapy || null
                  };
                });

                // Sortiraj po datumu (najnoviji prvo)
                this.patientAppointmentsWithTherapies.sort((a, b) => {
                  const dateCompare = b.date.localeCompare(a.date);
                  if (dateCompare !== 0) return dateCompare;
                  return b.timeSlot.localeCompare(a.timeSlot);
                });

                this.isLoadingPatientDetails = false;
              },
              error: (err) => {
                console.error('Greška pri učitavanju terapija:', err);
                // Ako nema terapija, prikaži samo preglede
                this.patientAppointmentsWithTherapies = completedAppointments.map(app => ({
                  ...app,
                  therapy: null
                }));
                this.isLoadingPatientDetails = false;
              }
            });
        },
        error: (err) => {
          console.error('Greška pri učitavanju pregleda:', err);
          this.isLoadingPatientDetails = false;
        }
      });
  }

  // Follow-up appointment methods
  openFollowUpModal(appointment: any) {
    this.selectedAppointmentForFollowUp = appointment;
    this.showFollowUpModal = true;
    this.followUpForm.reset();
    this.availableTimeSlots = [];
    
    // Predloži datum za kontrolni pregled (npr. za 7 dana)
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + 7);
    this.followUpForm.patchValue({
      date: suggestedDate.toISOString().split('T')[0],
      reason: 'Kontrolni pregled'
    });

    // Učitaj slobodne termine za predloženi datum
    this.loadAvailableTimeSlots(suggestedDate.toISOString().split('T')[0]);
  }

  onFollowUpDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedDate = input.value;
    if (selectedDate) {
      this.loadAvailableTimeSlots(selectedDate);
    }
  }

  loadAvailableTimeSlots(date: string) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) return;

    this.isLoadingTimeSlots = true;
    this.availableTimeSlots = [];

    // Pozovi backend endpoint koji vraća slobodne termine
    this.appointmentsService.getAvailableSlots(currentUser.id, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots) => {
          this.availableTimeSlots = slots.map(slot => slot.toString());
          this.isLoadingTimeSlots = false;
        },
        error: (err) => {
          console.error('Greška pri učitavanju slobodnih termina:', err);
          this.availableTimeSlots = [];
          this.isLoadingTimeSlots = false;
        }
      });
  }

  closeFollowUpModal() {
    this.showFollowUpModal = false;
    this.selectedAppointmentForFollowUp = null;
    this.followUpForm.reset();
  }

  submitFollowUp() {
    if (this.followUpForm.invalid) {
      alert('Molimo popunite sva obavezna polja');
      return;
    }

    if (!this.selectedAppointmentForFollowUp) {
      alert('Termin nije izabran');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      alert('Greška: Korisnik nije prijavljen');
      return;
    }

    this.isSubmittingFollowUp = true;

    const appointmentData = {
      patientId: this.selectedAppointmentForFollowUp.patientId,
      doctorId: currentUser.id,
      date: this.followUpForm.value.date,
      timeSlot: this.followUpForm.value.timeSlot,
      reason: this.followUpForm.value.reason || 'Kontrolni pregled',
      notes: this.followUpForm.value.notes || ''
    };

    // Koristi novi endpoint za doktora
    this.appointmentsService.scheduleAppointmentForPatient(appointmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmittingFollowUp = false;
          alert('Kontrolni pregled uspešno zakazan!');
          this.closeFollowUpModal();
          this.loadMyAppointments();
        },
        error: (err: any) => {
          this.isSubmittingFollowUp = false;
          console.error('Greška pri zakazivanju kontrolnog pregleda:', err);
          alert(err.error?.message || 'Greška pri zakazivanju kontrolnog pregleda');
        }
      });
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
        gender: currentUser?.gender || '',
        specialization: currentUser?.specialization || ''
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
  
  // ===== BLOK TERMINI =====
  openBlockAppointmentModal() {
    this.showBlockAppointmentModal = true;
    this.initializeBlockAppointmentForm();
    this.setupBlockFormListeners();
    this.loadAllPatientsForBlockAppointment();
  }

  closeBlockAppointmentModal() {
    this.showBlockAppointmentModal = false;
    this.blockAppointmentForm.reset();
    this.availableStartTimes = [];
  }

  initializeBlockAppointmentForm() {
    const currentUser = this.authService.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];
    
    this.blockAppointmentForm = this.fb.group({
      doctorId: [currentUser?.id || '', Validators.required],
      patientId: ['', Validators.required], 
      date: [today, Validators.required],
      startTime: ['', Validators.required],
      numberOfSlots: [8, [Validators.required, Validators.min(1), Validators.max(16)]],
      reason: ['OPERACIJA', Validators.required],
      notes: ['']
    });
  }

  setupBlockFormListeners() {
    // Kada se promeni datum, učitaj slobodne slotove
    this.blockAppointmentForm.get('date')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAvailableStartTimes());
    
    // Učitaj slotove odmah
    this.loadAvailableStartTimes();
  }

  loadAvailableStartTimes() {
    const currentUser = this.authService.getCurrentUser();
    const doctorId = currentUser?.id;
    const date = this.blockAppointmentForm.get('date')?.value;

    if (!doctorId || !date) {
      this.availableStartTimes = [];
      return;
    }

    this.isLoadingStartTimes = true;
    this.appointmentsService.getAvailableSlots(doctorId, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (slots: string[]) => {
          this.availableStartTimes = slots;
          this.isLoadingStartTimes = false;
          
          // Automatski izaberi prvi slobodan slot
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
          this.loadMyAppointments(); // Refresh termina
        },
        error: (err: any) => {
          this.isSubmittingBlockAppointment = false;
          console.error('Greška pri kreiranju blok termina:', err);
          const errorMsg = err.error?.message || err.error?.error || 'Greška pri kreiranju blok termina';
          alert(errorMsg);
        }
      });
  }
}
