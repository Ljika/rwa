import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, take } from 'rxjs';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { AppointmentsService, CreateAppointmentDto } from '../../../core/services/appointments.service';
import { TimeSlot } from '../../../shared/models/appointment.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-appointment.component.html',
  styleUrl: './book-appointment.component.scss'
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentStep: number = 1; // 1: Izaberi doktora, 2: Izaberi datum, 3: Izaberi termin
  
  myDoctors: User[] = [];
  loadingDoctors: boolean = false;
  
  selectedDoctor: User | null = null;
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
          this.currentStep = 3;
          
          if (slots.length === 0) {
            this.errorMessage = 'Nema slobodnih termina za izabrani datum';
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
    if (!this.selectedDoctor || !this.selectedDate || !this.selectedTimeSlot) {
      this.errorMessage = 'Molimo izaberite doktora, datum i termin';
      return;
    }

    this.isBooking = true;
    this.errorMessage = '';
    this.successMessage = '';

    const dto: CreateAppointmentDto = {
      doctorId: this.selectedDoctor.id,
      date: this.selectedDate,
      timeSlot: this.selectedTimeSlot,
      reason: this.bookingForm.value.reason || undefined,
      notes: this.bookingForm.value.notes || undefined
    };

    console.log('Zakazivanje termina sa podacima:', dto);

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
          console.error('Greška pri zakazivanju - pun error objekat:', error);
          console.error('Error response body:', error.error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          
          const backendMessage = error.error?.message || error.error?.error || error.statusText;
          this.errorMessage = backendMessage || 'Greška pri zakazivanju termina';
          this.isBooking = false;
        }
      });
  }

  resetForm() {
    this.currentStep = 1;
    this.selectedDoctor = null;
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
        this.selectedDate = '';
        this.selectedTimeSlot = null;
        this.availableSlots = [];
      } else if (this.currentStep === 2) {
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
