import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface CreateScheduleDto {
  doctorId: string;
  dateFrom: string;
  dateTo: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
}

@Component({
  selector: 'app-add-schedule-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-schedule-form.component.html',
  styleUrl: './add-schedule-form.component.scss'
})
export class AddScheduleFormComponent implements OnInit, OnChanges {
  @Input() doctorId!: string;
  @Input() doctorName: string = '';
  @Input() successMessage: string = '';
  @Input() errorMessage: string = '';
  
  @Output() submitSchedule = new EventEmitter<CreateScheduleDto>();
  @Output() cancel = new EventEmitter<void>();

  scheduleForm!: FormGroup;
  isSubmitting: boolean = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.scheduleForm = this.fb.group({
      dateFrom: ['', Validators.required],
      dateTo: ['', Validators.required],
      shift: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reset submitting state when messages change
    if (changes['successMessage'] || changes['errorMessage']) {
      this.isSubmitting = false;
    }
  }

  onSubmit() {
    if (this.scheduleForm.valid && this.doctorId) {
      this.isSubmitting = true;
      const formValue = this.scheduleForm.value;
      
      this.submitSchedule.emit({
        doctorId: this.doctorId,
        dateFrom: formValue.dateFrom,
        dateTo: formValue.dateTo,
        shift: formValue.shift
      });
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  resetForm() {
    this.scheduleForm.reset();
    this.isSubmitting = false;
  }
}
