import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Gender } from '../../../shared/models/user.model';

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  specialization: string;
}

@Component({
  selector: 'app-add-doctor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-doctor-form.component.html',
  styleUrl: './add-doctor-form.component.scss'
})
export class AddDoctorFormComponent implements OnInit {
  @Output() submitForm = new EventEmitter<CreateDoctorDto>();
  @Output() cancel = new EventEmitter<void>();

  doctorForm!: FormGroup;
  genders = Object.values(Gender);
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.doctorForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: [''],
      dateOfBirth: [''],
      gender: [''],
      specialization: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.doctorForm.valid) {
      this.isSubmitting = true;
      this.submitForm.emit(this.doctorForm.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  resetForm() {
    this.doctorForm.reset();
    this.isSubmitting = false;
  }
}
