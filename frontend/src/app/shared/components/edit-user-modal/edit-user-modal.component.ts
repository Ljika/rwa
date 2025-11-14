import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User, Gender } from '../../../shared/models/user.model';

export interface UpdateUserDto {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  specialization?: string;
}

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-user-modal.component.html',
  styleUrl: './edit-user-modal.component.scss'
})
export class EditUserModalComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Input() show: boolean = false;
  
  @Output() save = new EventEmitter<UpdateUserDto>();
  @Output() close = new EventEmitter<void>();

  editForm!: FormGroup;
  genders = Object.values(Gender);
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: [''],
      dateOfBirth: [''],
      gender: [''],
      specialization: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reset submitting state when modal opens/closes
    if (changes['show']) {
      this.isSubmitting = false;
    }
    
    if (changes['user'] && this.user) {
      this.editForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phoneNumber: this.user.phoneNumber || '',
        dateOfBirth: this.user.dateOfBirth || '',
        gender: this.user.gender || '',
        specialization: this.user.specialization || ''
      });
    }
  }

  onSubmit() {
    if (this.editForm.valid && this.user) {
      this.isSubmitting = true;
      
      const formValue = this.editForm.value;
      
      const updateData: UpdateUserDto = {
        id: this.user.id,
        firstName: formValue.firstName,
        lastName: formValue.lastName
      };

      // Only include optional fields if they have values
      if (formValue.phoneNumber) {
        updateData.phoneNumber = formValue.phoneNumber;
      }
      
      if (formValue.dateOfBirth) {
        updateData.dateOfBirth = formValue.dateOfBirth;
      }
      
      if (formValue.gender) {
        updateData.gender = formValue.gender;
      }

      // Add specialization only for doctors and if it has a value
      if (this.isDoctor() && formValue.specialization) {
        updateData.specialization = formValue.specialization;
      }

      console.log('Sending updateData:', updateData);
      this.save.emit(updateData);
    }
  }

  onClose() {
    this.close.emit();
    this.isSubmitting = false;
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  isDoctor(): boolean {
    return this.user?.role === 'Doctor';
  }

  getUserRoleLabel(): string {
    if (!this.user) return '';
    
    switch (this.user.role) {
      case 'Patient': return 'Pacijenta';
      case 'Doctor': return 'Doktora';
      case 'Admin': return 'Administratora';
      default: return 'Korisnika';
    }
  }
}
