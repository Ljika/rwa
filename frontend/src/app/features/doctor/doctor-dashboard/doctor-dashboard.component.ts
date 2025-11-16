import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { DoctorSchedulesService } from '../../../core/services/doctor-schedules.service';
import { Gender, User } from '../../../shared/models/user.model';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { TherapiesService } from '../../../core/services/therapies.service';
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
  imports: [CommonModule, ReactiveFormsModule, ScheduleCalendarComponent, FilterByDatePipe, ChatComponent],
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
  patientDetailsView: 'therapies' | 'appointments' = 'therapies';
  patientTherapies: any[] = [];
  patientAppointments: any[] = [];
  isLoadingPatientDetails: boolean = false;
  
  // Smene tab data
  mySchedules: any[] = [];
  isLoadingSchedules: boolean = false;
  selectedMonth: string = '';

  // Termini tab data
  myAppointments: any[] = [];
  isLoadingAppointments: boolean = false;
  get pendingAppointments() {
    return this.myAppointments.filter(a => a.status === 'Pending');
  }
  selectedScheduledDate: string = '';
  get scheduledAppointments() {
    // Show all scheduled (approved/completed) appointments, no date filtering here
    return this.myAppointments.filter(a => a.status === 'Approved' || a.status === 'Completed');
  }

  // Grupisanje termina - kombinuje uzastopne termine sa istim reason i patientId
  get groupedScheduledAppointments() {
    const appointments = this.scheduledAppointments;
    const grouped: any[] = [];
    const processed = new Set<string>();

    // Sortiraj po datumu i vremenu
    const sorted = [...appointments].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    for (const apt of sorted) {
      if (processed.has(apt.id)) continue;

      // Nađi sve uzastopne termine sa istim reason i patientId
      const blockAppointments = this.findConsecutiveAppointments(apt, sorted);
      
      if (blockAppointments.length > 1) {
        // Blok termin
        blockAppointments.forEach(a => processed.add(a.id));
        grouped.push({
          ...apt,
          isBlock: true,
          startTime: blockAppointments[0].timeSlot,
          endTime: this.calculateEndTime(blockAppointments[blockAppointments.length - 1].timeSlot),
          duration: `${blockAppointments.length * 0.5}h`,
          blockSize: blockAppointments.length,
          allAppointmentIds: blockAppointments.map(a => a.id)
        });
      } else {
        // Obični termin
        processed.add(apt.id);
        grouped.push({ ...apt, isBlock: false });
      }
    }

    return grouped;
  }

  private findConsecutiveAppointments(appointment: any, allAppointments: any[]): any[] {
    const result = [appointment];
    
    // Uzmi sve termine sa istim datumom, reason i patientId
    const candidates = allAppointments.filter(a => 
      a.date === appointment.date &&
      a.reason === appointment.reason &&
      a.patientId === appointment.patientId &&
      a.id !== appointment.id
    );

    if (candidates.length === 0) return result;

    // Sortiraj po vremenu
    const sorted = [appointment, ...candidates].sort((a, b) => 
      a.timeSlot.localeCompare(b.timeSlot)
    );

    // Proveri da li su uzastopni (svaki je 30min posle prethodnog)
    const consecutive: any[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const prevEndTime = this.calculateEndTime(consecutive[consecutive.length - 1].timeSlot);
      if (prevEndTime === sorted[i].timeSlot) {
        consecutive.push(sorted[i]);
      } else {
        break; // Prekinuo se niz
      }
    }

    return consecutive;
  }

  private calculateEndTime(timeSlot: string): string {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    let endMinutes = minutes + 30;
    let endHours = hours;
    if (endMinutes >= 60) {
      endHours++;
      endMinutes = 0;
    }
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
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

  constructor(
    private authService: AuthService,
    private doctorPatientService: DoctorPatientService,
    private doctorSchedulesService: DoctorSchedulesService,
    private appointmentsService: AppointmentsService,
    private therapiesService: TherapiesService,
    private fb: FormBuilder,
    private store: Store
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

    // Učitaj lekove iz store-a
    this.store.dispatch(loadDrugs());
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
  viewPatientTherapies(patient: any) {
    this.selectedPatient = patient;
    this.patientDetailsView = 'therapies';
    this.showPatientDetailsModal = true;
    this.loadPatientTherapies(patient.id);
  }

  viewPatientAppointments(patient: any) {
    this.selectedPatient = patient;
    this.patientDetailsView = 'appointments';
    this.showPatientDetailsModal = true;
    this.loadPatientAppointments(patient.id);
  }

  closePatientDetailsModal() {
    this.showPatientDetailsModal = false;
    this.selectedPatient = null;
    this.patientTherapies = [];
    this.patientAppointments = [];
  }

  loadPatientTherapies(patientId: string) {
    this.isLoadingPatientDetails = true;
    // Filter therapies for this specific patient from all appointments
    this.appointmentsService.getMyAppointmentsAsDoctor()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          // Get all completed appointments for this patient that have therapies
          const completedAppointments = appointments.filter(
            app => app.patientId === patientId && app.status === 'Completed'
          );
          
          // Load therapies for these appointments
          this.therapiesService.getMyPrescribedTherapies()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (therapies) => {
                this.patientTherapies = therapies.filter(t => t.patientId === patientId);
                this.isLoadingPatientDetails = false;
              },
              error: (err) => {
                console.error('Greška pri učitavanju terapija:', err);
                this.isLoadingPatientDetails = false;
              }
            });
        },
        error: (err) => {
          console.error('Greška:', err);
          this.isLoadingPatientDetails = false;
        }
      });
  }

  loadPatientAppointments(patientId: string) {
    this.isLoadingPatientDetails = true;
    this.appointmentsService.getMyAppointmentsAsDoctor()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.patientAppointments = appointments.filter(
            app => app.patientId === patientId && app.status === 'Completed'
          );
          this.isLoadingPatientDetails = false;
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
}
