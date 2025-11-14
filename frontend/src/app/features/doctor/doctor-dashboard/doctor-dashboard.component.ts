import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { DoctorSchedulesService } from '../../../core/services/doctor-schedules.service';
import { Gender, User } from '../../../shared/models/user.model';
import { AppointmentsService } from '../../../core/services/appointments.service';
import { ScheduleCalendarComponent } from '../../../shared/components/schedule-calendar/schedule-calendar.component';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ScheduleCalendarComponent],
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
  get scheduledAppointments() {
    return this.myAppointments.filter(a => a.status === 'Approved' || a.status === 'Completed');
  }

  constructor(
    private authService: AuthService,
    private doctorPatientService: DoctorPatientService,
    private doctorSchedulesService: DoctorSchedulesService,
    private appointmentsService: AppointmentsService,
    private fb: FormBuilder
  ) {
    // Observables iz Store-a
    this.currentUser$ = this.authService.currentUser$;
    this.isUpdating$ = this.authService.isLoading$;
    
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
  }

  ngOnInit() {
    // Učitaj pacijente odmah
    this.loadMyPatients();
    
    // Set default month to current month
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Učitaj termine za doktora
  this.loadMyAppointments();
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
