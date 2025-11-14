import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DrugsService, Drug } from '../../../core/services/drugs.service';
import { ManufacturersService, Manufacturer } from '../../../core/services/manufacturers.service';

@Component({
  selector: 'app-drugs-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './drugs-admin.component.html',
  styleUrl: './drugs-admin.component.scss'
})
export class DrugsAdminComponent {
  lekovi: Drug[] = [];
  manufacturers: Manufacturer[] = [];
  showLekForm = false;
  editLek: Drug | null = null;
  lekForm: FormGroup;
  drugTypes = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Other'
  ];

  constructor(
    private drugsService: DrugsService,
    private manufacturersService: ManufacturersService,
    private fb: FormBuilder
  ) {
    this.lekForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      dosage: ['', Validators.required],
      description: [''],
      manufacturerId: ['', Validators.required]
    });
    this.loadLekovi();
    this.loadManufacturers();
  }

  loadLekovi() {
    this.drugsService.getAll().subscribe({
      next: (data) => (this.lekovi = data),
      error: () => (this.lekovi = [])
    });
  }

  loadManufacturers() {
    this.manufacturersService.getAll().subscribe(manu => this.manufacturers = manu);
  }

  startEditLek(lek: Drug) {
    this.editLek = lek;
    this.showLekForm = true;
    this.lekForm.patchValue({
      name: lek.name,
      type: lek.type,
      dosage: lek.dosage || '',
      description: lek.description || '',
      manufacturerId: lek.manufacturer?.id || ''
    });
  }

  cancelLekForm() {
    this.showLekForm = false;
    this.editLek = null;
    this.lekForm.reset();
  }

  submitLekForm() {
    if (this.lekForm.invalid) return;
    const value = {
      name: String(this.lekForm.value.name ?? ''),
      type: String(this.lekForm.value.type ?? ''),
      dosage: String(this.lekForm.value.dosage ?? ''),
      description: String(this.lekForm.value.description ?? ''),
      manufacturerId: String(this.lekForm.value.manufacturerId ?? '')
    };
    if (this.editLek) {
      this.drugsService.update(this.editLek.id, value).subscribe({
        next: () => { this.loadLekovi(); this.cancelLekForm(); },
        error: () => alert('Greška pri izmeni leka')
      });
    } else {
      this.drugsService.create(value).subscribe({
        next: () => { this.loadLekovi(); this.cancelLekForm(); },
        error: () => alert('Greška pri dodavanju leka')
      });
    }
  }

  deleteLek(lek: Drug) {
    if (!confirm('Da li ste sigurni da želite da obrišete lek: ' + lek.name + '?')) return;
    this.drugsService.delete(lek.id).subscribe({
      next: () => this.loadLekovi(),
      error: () => alert('Greška pri brisanju leka')
    });
  }
}
