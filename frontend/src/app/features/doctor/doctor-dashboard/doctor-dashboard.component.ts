import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { Gender, User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss'
})
export class DoctorDashboardComponent implements OnInit {
  activeTab: string = 'profil';
  currentUser$: Observable<User | null>;
  isEditMode: boolean = false;
  editProfileForm: FormGroup;
  genders = Object.values(Gender);
  isUpdating$: Observable<boolean>;

  // Pacijenti tab data
  myPatients: any[] = [];
  isLoadingPatients: boolean = false;

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
  }

  selectTab(tab: string) {
    this.activeTab = tab;
    
    // Učitaj podatke za tab ako je potrebno
    if (tab === 'pacijenti' && this.myPatients.length === 0) {
      this.loadMyPatients();
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
