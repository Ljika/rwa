import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { Gender, User } from '../../../shared/models/user.model';
import { BookAppointmentComponent } from '../../../shared/components/book-appointment/book-appointment.component';
import { MyAppointmentsComponent } from '../../../shared/components/my-appointments/my-appointments.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BookAppointmentComponent, MyAppointmentsComponent],
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
  isLoadingKarton: boolean = false;

  constructor(
    private authService: AuthService,
    private doctorPatientService: DoctorPatientService,
    private fb: FormBuilder
  ) {
    // Observables iz Store-a
    this.currentUser$ = this.authService.currentUser$;
    this.isUpdating$ = this.authService.isLoading$;
    
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

  // Load Karton data
  async loadKartonData() {
    this.isLoadingKarton = true;
    
    try {
      // Učitaj samo lekare
      this.myDoctors = await this.doctorPatientService.getMyDoctors();
    } catch (error: any) {
      console.error('Greška pri učitavanju lekara:', error);
      alert(error.message || 'Greška pri učitavanju lekara');
    } finally {
      this.isLoadingKarton = false;
    }
  }
}
