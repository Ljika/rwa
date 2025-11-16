import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Gender } from '../../../shared/models/user.model';

export interface CreateAdminDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
}

@Component({
  selector: 'app-add-admin-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-admin-form.component.html',
  styleUrl: './add-admin-form.component.scss'
})
export class AddAdminFormComponent implements OnInit {
  @Output() submitForm = new EventEmitter<CreateAdminDto>();
  @Output() cancel = new EventEmitter<void>();

  adminForm!: FormGroup;
  genders = Object.values(Gender);
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.adminForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: [''],
      dateOfBirth: [''],
      gender: ['']
    });
  }

  onSubmit() {
    if (this.adminForm.valid) {
      this.isSubmitting = true;
      this.submitForm.emit(this.adminForm.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  resetForm() {
    this.adminForm.reset();
    this.isSubmitting = false;
  }
}
