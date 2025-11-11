import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Gender, UpdateUserRequest, User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent {
  activeTab: string = 'profil'; 
  currentUser: User | null = null;
  isEditMode: boolean = false;
  editProfileForm: FormGroup;
  genders = Object.values(Gender);
  isUpdating: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.currentUser = this.authService.getCurrentUser();
    
    // Inicijalizuj formu sa trenutnim podacima
    this.editProfileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', Validators.required],
      lastName: [this.currentUser?.lastName || '', Validators.required],
      phoneNumber: [this.currentUser?.phoneNumber || ''],
      dateOfBirth: [this.currentUser?.dateOfBirth || ''],
      gender: [this.currentUser?.gender || '']
    });
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      // Popuni formu sa trenutnim podacima
      this.editProfileForm.patchValue({
        firstName: this.currentUser?.firstName || '',
        lastName: this.currentUser?.lastName || '',
        phoneNumber: this.currentUser?.phoneNumber || '',
        dateOfBirth: this.currentUser?.dateOfBirth || '',
        gender: this.currentUser?.gender || ''
      });
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editProfileForm.reset();
  }

  async saveProfile() {
    if (this.editProfileForm.invalid || !this.currentUser?.id) {
      return;
    }

    this.isUpdating = true;
    
    try {
      const updateData: UpdateUserRequest = this.editProfileForm.value;
      const updatedUser = await this.authService.updateProfileWithFetch(
        this.currentUser.id, 
        updateData
      );
      
      this.currentUser = updatedUser;
      this.isEditMode = false;
      alert('Profil uspešno ažuriran!');
    } catch (error: any) {
      console.error('Greška pri izmeni profila:', error);
      alert(error.message || 'Greška pri čuvanju profila');
    } finally {
      this.isUpdating = false;
    }
  }
}
