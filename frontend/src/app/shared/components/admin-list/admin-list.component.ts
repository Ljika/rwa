import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-admin-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-list.component.html',
  styleUrl: './admin-list.component.scss'
})
export class AdminListComponent {
  @Input() admins: User[] = [];
  @Input() loading: boolean = false;
  
  @Output() deleteAdmin = new EventEmitter<string>();
  @Output() editAdmin = new EventEmitter<User>();

  onDelete(adminId: string, adminEmail: string) {
    if (adminEmail === 'admin@example.com') {
      alert('Glavni administrator ne može biti obrisan!');
      return;
    }
    
    if (confirm('Da li ste sigurni da želite da obrišete ovog administratora?')) {
      this.deleteAdmin.emit(adminId);
    }
  }

  onEdit(admin: User) {
    this.editAdmin.emit(admin);
  }

  isMainAdmin(email: string): boolean {
    return email === 'admin@example.com';
  }
}
