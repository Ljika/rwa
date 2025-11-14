import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})
export class PatientListComponent {
  @Input() patients: User[] = [];
  @Input() loading: boolean = false;
  
  @Output() deletePatient = new EventEmitter<string>();
  @Output() editPatient = new EventEmitter<User>();

  onDelete(patientId: string) {
    if (confirm('Da li ste sigurni da želite da obrišete ovog pacijenta?')) {
      this.deletePatient.emit(patientId);
    }
  }

  onEdit(patient: User) {
    this.editPatient.emit(patient);
  }
}
