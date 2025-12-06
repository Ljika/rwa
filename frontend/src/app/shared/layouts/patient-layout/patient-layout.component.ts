import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectUser } from '../../../store/auth/auth.selectors';
import { logout } from '../../../store/auth/auth.actions';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-layout.component.html',
  styleUrl: './patient-layout.component.scss'
})
export class PatientLayoutComponent implements OnInit {
  @Input() activeTab: string = 'karton';
  @Output() tabChanged = new EventEmitter<string>();
  currentUser$: Observable<User | null>;
  currentYear: number = new Date().getFullYear();

  constructor(private store: Store) {
    this.currentUser$ = this.store.select(selectUser);
  }

  ngOnInit(): void {
    // Proveri početnu širinu i zatvori sidebar ako je mali ekran
    this.checkScreenSize();
    
    // Dodaj listener za resize
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
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

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.tabChanged.emit(tab);
  }

  getPageTitle(): string {
    const titles: { [key: string]: string } = {
      'karton': 'Medicinski Karton',
      'terapije': 'Moje Terapije',
      'zakazi': 'Zakaži Termin',
      'termini': 'Moji Termini',
      'profil': 'Moj Profil'
    };
    return titles[this.activeTab] || 'Dashboard';
  }

  sidebarToggle(): void {
    const body = document.getElementsByTagName('body')[0];
    if (body.classList.contains('sidebar-mini')) {
      body.classList.remove('sidebar-mini');
    } else {
      body.classList.add('sidebar-mini');
    }
  }

  logout(): void {
    this.store.dispatch(logout());
  }
}
