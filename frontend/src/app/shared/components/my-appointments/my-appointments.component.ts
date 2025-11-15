import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AppointmentsService, Appointment } from '../../../core/services/appointments.service';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.scss'
})
export class MyAppointmentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activeTab: 'requests' | 'scheduled' | 'completed' = 'requests';
  
  allAppointments: Appointment[] = [];
  requestAppointments: Appointment[] = [];
  scheduledAppointments: Appointment[] = [];
  completedAppointments: Appointment[] = [];
  
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private appointmentsService: AppointmentsService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAppointments() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.appointmentsService.getMyAppointmentsAsPatient()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          this.allAppointments = appointments;
          
          // Filtriraj po statusu
          this.requestAppointments = appointments.filter(
            app => app.status === 'Pending'
          );
          
          this.scheduledAppointments = appointments.filter(
            app => app.status === 'Approved'
          );
          
          this.completedAppointments = appointments.filter(
            app => app.status === 'Completed'
          );
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Greška pri učitavanju termina:', error);
          this.errorMessage = 'Greška pri učitavanju termina';
          this.isLoading = false;
        }
      });
  }

  selectTab(tab: 'requests' | 'scheduled' | 'completed') {
    this.activeTab = tab;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'Cancelled':
        return 'status-cancelled';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Na čekanju';
      case 'Approved':
        return 'Odobren';
      case 'Rejected':
        return 'Odbijen';
      case 'Cancelled':
        return 'Otkazan';
      case 'Completed':
        return 'Završen';
      default:
        return status;
    }
  }

  cancelAppointment(appointmentId: string) {
    if (!confirm('Da li ste sigurni da želite da otkažete ovaj termin?')) {
      return;
    }

    this.appointmentsService.updateAppointmentStatus(appointmentId, { status: 'Cancelled' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Termin uspešno otkazan';
          this.loadAppointments();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Greška pri otkazivanju termina:', error);
          this.errorMessage = 'Greška pri otkazivanju termina';
        }
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(timeSlot: string): string {
    return timeSlot.replace('_', ':');
  }
}
