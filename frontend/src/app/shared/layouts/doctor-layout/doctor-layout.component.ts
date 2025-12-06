import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-layout.component.html',
  styleUrl: './doctor-layout.component.scss'
})
export class DoctorLayoutComponent {
  @Input() activeTab: string = 'profil';
  @Output() tabChanged = new EventEmitter<string>();
  
  currentUser$: Observable<User | null>;
  currentYear = new Date().getFullYear();

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    this.currentUser$ = this.store.select(selectUser);
    
    // Proveri početnu širinu i zatvori sidebar ako je mali ekran
    setTimeout(() => this.checkScreenSize(), 0);
    
    // Dodaj listener za resize
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    const body = document.getElementsByTagName('body')[0];
    // Očisti potencijalno otvoren mobilni meni/overlay
    body.classList.remove('nav-open');
    document.querySelectorAll('.close-layer').forEach(el => el.remove());
    if (window.innerWidth <= 991) {
      // Mali ekran - minimizuj sidebar
      body.classList.add('sidebar-mini');
    } else {
      // Veliki ekran - otvori sidebar
      body.classList.remove('sidebar-mini');
    }
  }

  selectTab(tab: string) {
    this.tabChanged.emit(tab);
  }

  logout() {
    this.store.dispatch(logout());
    this.router.navigate(['/']);
  }

  sidebarToggle() {
    const body = document.getElementsByTagName('body')[0];
    if (body.classList.contains('sidebar-mini')) {
      body.classList.remove('sidebar-mini');
    } else {
      body.classList.add('sidebar-mini');
    }
  }
}
