import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  @Input() activeTab: string = 'profil';
  @Output() tabChanged = new EventEmitter<string>();

  currentUser$: Observable<User | null>;
  currentYear: number = new Date().getFullYear();

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    // Proveri početnu širinu i zatvori sidebar ako je mali ekran
    this.checkScreenSize();
    
    // Dodaj listener za resize
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    const sidebar = document.querySelector('.sidebar');
    const body = document.body;
    // Uvek očisti eventualno otvoreni mobilni meni/overlay
    body.classList.remove('nav-open');
    document.querySelectorAll('.close-layer').forEach(el => el.remove());
    if (window.innerWidth <= 991) {
      // Mali ekran - zatvori sidebar
      sidebar?.classList.add('toggled');
    } else {
      // Veliki ekran - otvori sidebar
      sidebar?.classList.remove('toggled');
    }
  }

  selectTab(tab: string) {
    this.tabChanged.emit(tab);
  }

  logout() {
    this.authService.logout();
  }

  sidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.toggle('toggled');
  }
}
