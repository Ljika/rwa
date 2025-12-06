import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ManufacturersService, Manufacturer } from '../../../core/services/manufacturers.service';

@Component({
  selector: 'app-manufacturers-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manufacturers-admin.component.html',
  styleUrl: './manufacturers-admin.component.scss'
})
export class ManufacturersAdminComponent {
  manufacturers: Manufacturer[] = [];
  showForm = false;
  editManufacturer: Manufacturer | null = null;
  manufacturerForm: FormGroup;

  constructor(private manufacturersService: ManufacturersService, private fb: FormBuilder) {
    this.manufacturerForm = this.fb.group({
      name: ['', Validators.required],
      country: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]]
    });
    this.loadManufacturers();
  }

  loadManufacturers() {
    this.manufacturersService.getAll().subscribe(manu => this.manufacturers = manu);
  }

  openAddModal() {
    this.editManufacturer = null;
    this.showForm = true;
    this.manufacturerForm.reset();
  }

  startEdit(manufacturer: Manufacturer) {
    this.editManufacturer = manufacturer;
    this.showForm = true;
    this.manufacturerForm.patchValue({
      name: manufacturer.name,
      country: manufacturer.country || '',
      contactEmail: manufacturer.contactEmail || ''
    });
  }

  closeModal() {
    this.showForm = false;
    this.editManufacturer = null;
    this.manufacturerForm.reset();
  }

  cancelForm() {
    this.closeModal();
  }

  submitForm() {
    if (this.manufacturerForm.invalid) return;
    const value = {
      name: String(this.manufacturerForm.value.name ?? ''),
      country: String(this.manufacturerForm.value.country ?? ''),
      contactEmail: String(this.manufacturerForm.value.contactEmail ?? '')
    };
    if (this.editManufacturer) {
      // Update
      this.manufacturersService.update(this.editManufacturer.id, value).subscribe({
        next: () => { 
          alert('Proizvođač uspešno izmenjen!');
          this.loadManufacturers(); 
          this.closeModal(); 
        },
        error: () => alert('Greška pri izmeni proizvođača')
      });
    } else {
      // Create
      this.manufacturersService.create(value).subscribe({
        next: () => { 
          alert('Proizvođač uspešno dodat!');
          this.loadManufacturers(); 
          this.closeModal(); 
        },
        error: () => alert('Greška pri dodavanju proizvođača')
      });
    }
  }

  deleteManufacturer(manufacturer: Manufacturer) {
    if (!confirm('Da li ste sigurni da želite da obrišete proizvođača: ' + manufacturer.name + '?')) return;
    this.manufacturersService.delete(manufacturer.id).subscribe({
      next: () => this.loadManufacturers(),
      error: () => alert('Greška pri brisanju proizvođača')
    });
  }
}
