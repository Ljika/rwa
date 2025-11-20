import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, take } from 'rxjs';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { AppointmentsService, CreateAppointmentDto } from '../../../core/services/appointments.service';
import { AppointmentTypesService } from '../../../core/services/appointment-types.service';
import { TimeSlot } from '../../../shared/models/appointment.model';
import { User } from '../../../shared/models/user.model';
import { AppointmentType } from '../../../core/models/appointment-type.model';
import { Specialization } from '../../../common/enums/specialization.enum';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.scss'
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentStep: number = 1; // 1: Izaberi doktora, 2: Izaberi tip pregleda, 3: Izaberi datum, 4: Izaberi termin
  
  myDoctors: User[] = [];
  loadingDoctors: boolean = false;
  
  selectedDoctor: User | null = null;
  selectedAppointmentType: AppointmentType | null = null;
  availableAppointmentTypes: AppointmentType[] = [];
  loadingAppointmentTypes: boolean = false;
  selectedDate: string = '';
  selectedTimeSlot: TimeSlot | null = null;
  
  availableSlots: TimeSlot[] = [];
  loadingSlots: boolean = false;
  
  bookingForm: FormGroup;
  isBooking: boolean = false;
  
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private doctorPatientService: DoctorPatientService,
    private appointmentsService: AppointmentsService,
    private appointmentTypesService: AppointmentTypesService,
    private fb: FormBuilder
  ) {
    this.bookingForm = this.fb.group({
      reason: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadMyDoctors();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadMyDoctors() {
    this.loadingDoctors = true;
    try {
      this.myDoctors = await this.doctorPatientService.getMyDoctors();
    } catch (error: any) {
      console.error('Greška pri učitavanju doktora:', error);
      this.errorMessage = 'Greška pri učitavanju doktora';
    } finally {
      this.loadingDoctors = false;
    }
  }

  selectDoctor(doctor: User) {
    this.selectedDoctor = doctor;
    this.currentStep = 2;
    this.errorMessage = '';
    this.loadAppointmentTypesBySpecialization();
  }

  loadAppointmentTypesBySpecialization() {
    if (!this.selectedDoctor || !this.selectedDoctor.specialization) return;
    
    this.loadingAppointmentTypes = true;
    this.appointmentTypesService.getBySpecialization(this.selectedDoctor.specialization as Specialization)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.availableAppointmentTypes = types.filter(t => t.isActive);
          this.loadingAppointmentTypes = false;
          
          if (this.availableAppointmentTypes.length === 0) {
            this.errorMessage = 'Nema dostupnih tipova pregleda za ovu specijalizaciju';
          }
        },
        error: (error) => {
          console.error('Greška pri učitavanju tipova pregleda:', error);
          this.errorMessage = 'Greška pri učitavanju tipova pregleda';
          this.loadingAppointmentTypes = false;
        }
      });
  }

  selectAppointmentType(type: AppointmentType) {
    this.selectedAppointmentType = type;
    this.currentStep = 3;
    this.errorMessage = '';
  }

  selectDate(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;
    
    if (this.selectedDoctor && this.selectedDate) {
      this.loadAvailableSlots();
    }
  }

  loadAvailableSlots() {
    if (!this.selectedDoctor || !this.selectedDate) return;
    
    this.loadingSlots = true;
    this.errorMessage = '';
    
    // take(1): Automatski se unsubscribe-uje posle prvog emitovanja
    this.appointmentsService.getAvailableSlots(this.selectedDoctor.id, this.selectedDate)
      .pipe(
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.loadingSlots = false;
          
          if (slots.length === 0) {
            this.errorMessage = 'Nema slobodnih termina za izabrani datum. Molimo izaberite drugi datum.';
            this.currentStep = 3;
          } else {
            this.currentStep = 4;
          }
        },
        error: (error) => {
          console.error('Greška pri učitavanju termina:', error);
          this.errorMessage = 'Greška pri učitavanju slobodnih termina';
          this.loadingSlots = false;
        }
      });
  }

  selectTimeSlot(slot: TimeSlot) {
    this.selectedTimeSlot = slot;
  }

  bookAppointment() {
    if (!this.selectedDoctor || !this.selectedAppointmentType || !this.selectedDate || !this.selectedTimeSlot) {
      this.errorMessage = 'Molimo izaberite doktora, tip pregleda, datum i termin';
      return;
    }

    this.isBooking = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('=== DEBUG: Podaci pre kreiranje DTO ===');
    console.log('selectedDoctor:', this.selectedDoctor);
    console.log('selectedAppointmentType:', this.selectedAppointmentType);
    console.log('selectedDate:', this.selectedDate);
    console.log('selectedTimeSlot:', this.selectedTimeSlot);

    const dto: CreateAppointmentDto = {
      doctorId: this.selectedDoctor.id,
      appointmentTypeId: this.selectedAppointmentType.id,
      date: this.selectedDate,
      timeSlot: this.selectedTimeSlot,
      reason: this.bookingForm.value.reason || undefined,
      notes: this.bookingForm.value.notes || undefined
    };

    console.log('=== DEBUG: DTO koji se šalje na backend ===');
    console.log('DTO:', dto);
    console.log('DTO JSON:', JSON.stringify(dto, null, 2));

    this.appointmentsService.createAppointment(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointment) => {
          console.log('Termin uspešno zakazan:', appointment);
          this.successMessage = 'Termin uspešno zakazan! Čeka se odobrenje doktora.';
          this.isBooking = false;
          
          // Reset after 2 seconds
          setTimeout(() => {
            this.resetForm();
          }, 2000);
        },
        error: (error) => {
          console.error('=== DEBUG: Greška pri zakazivanju ===');
          console.error('Pun error objekat:', error);
          console.error('Error response body:', error.error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          
          // Ako je message array, prikaži prvi element
          let backendMessage;
          if (error.error?.message && Array.isArray(error.error.message)) {
            backendMessage = error.error.message[0];
            console.error('Backend validation errors:', error.error.message);
          } else {
            backendMessage = error.error?.message || error.error?.error || error.statusText;
          }
          
          this.errorMessage = backendMessage || 'Greška pri zakazivanju termina';
          this.isBooking = false;
        }
      });
  }

  resetForm() {
    this.currentStep = 1;
    this.selectedDoctor = null;
    this.selectedAppointmentType = null;
    this.availableAppointmentTypes = [];
    this.selectedDate = '';
    this.selectedTimeSlot = null;
    this.availableSlots = [];
    this.bookingForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
      
      if (this.currentStep === 1) {
        this.selectedDoctor = null;
        this.selectedAppointmentType = null;
        this.availableAppointmentTypes = [];
        this.selectedDate = '';
        this.selectedTimeSlot = null;
        this.availableSlots = [];
      } else if (this.currentStep === 2) {
        this.selectedAppointmentType = null;
        this.selectedDate = '';
        this.selectedTimeSlot = null;
        this.availableSlots = [];
      } else if (this.currentStep === 3) {
        this.selectedDate = '';
        this.selectedTimeSlot = null;
        this.availableSlots = [];
      }
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  formatTimeSlot(slot: TimeSlot): string {
    return slot;
  }
}
