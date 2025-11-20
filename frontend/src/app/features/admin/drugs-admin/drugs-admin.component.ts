import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { DrugsService, Drug } from '../../../core/services/drugs.service';
import { ManufacturersService, Manufacturer } from '../../../core/services/manufacturers.service';
import { DrugAllergiesService } from '../../../core/services/drug-allergies.service';
import { Allergy } from '../../../core/models/allergy.model';
import { DrugAllergy } from '../../../core/models/drug-allergy.model';
import { AppState } from '../../../store';
import { selectAllAllergies } from '../../../store/allergies/allergies.selectors';

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
  
  // Alergije
  allergies$: Observable<Allergy[]>;
  selectedAllergies: string[] = []; 
  drugAllergies: DrugAllergy[] = []; 
  isLoadingDrugAllergies: boolean = false;
  
  // Za modal prikaz alergija
  showAllergiesModal = false;
  selectedDrugForAllergies: Drug | null = null;
  viewDrugAllergiesList: DrugAllergy[] = [];

  constructor(
    private drugsService: DrugsService,
    private manufacturersService: ManufacturersService,
    private drugAllergiesService: DrugAllergiesService,
    private store: Store<AppState>,
    private fb: FormBuilder
  ) {
    this.allergies$ = this.store.select(selectAllAllergies);
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
    // Učitaj alergije leka
    this.loadDrugAllergies(lek.id);
  }

  cancelLekForm() {
    this.showLekForm = false;
    this.editLek = null;
    this.lekForm.reset();
    this.selectedAllergies = [];
    this.drugAllergies = [];
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
        next: () => { 
          // Dodaj nove alergije ako ima
          this.saveDrugAllergies(this.editLek!.id);
          this.loadLekovi(); 
          this.cancelLekForm(); 
        },
        error: () => alert('Greška pri izmeni leka')
      });
    } else {
      // Kreiranje novog leka
      this.drugsService.create(value).subscribe({
        next: (newDrug) => { 
          // Dodaj alergije za novi lek
          this.saveDrugAllergies(newDrug.id);
          this.loadLekovi(); 
          this.cancelLekForm(); 
        },
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

  // ===== ALERGIJE LEKA =====
  loadDrugAllergies(drugId: string) {
    this.isLoadingDrugAllergies = true;
    this.drugAllergiesService.getByDrug(drugId).subscribe({
      next: (allergies) => {
        this.drugAllergies = allergies;
        this.selectedAllergies = allergies.map(da => da.allergyId);
        this.isLoadingDrugAllergies = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju alergija leka:', err);
        this.isLoadingDrugAllergies = false;
      }
    });
  }

  toggleAllergySelection(allergyId: string) {
    const index = this.selectedAllergies.indexOf(allergyId);
    if (index > -1) {
      this.selectedAllergies.splice(index, 1);
      
      if (this.editLek) {
        const existingDrugAllergy = this.drugAllergies.find(da => da.allergyId === allergyId);
        if (existingDrugAllergy) {
          this.drugAllergiesService.delete(existingDrugAllergy.id).subscribe({
            next: () => {
              this.drugAllergies = this.drugAllergies.filter(da => da.id !== existingDrugAllergy.id);
            },
            error: (err) => console.error('Greška pri brisanju alergije:', err)
          });
        }
      }
    } else {
      // Čekiranje - dodaj u selectedAllergies
      this.selectedAllergies.push(allergyId);
    }
  }

  isAllergySelected(allergyId: string): boolean {
    return this.selectedAllergies.includes(allergyId);
  }

  saveDrugAllergies(drugId: string) {
    const existingAllergyIds = this.drugAllergies.map(da => da.allergyId);
    const allergiesToAdd = this.selectedAllergies.filter(id => !existingAllergyIds.includes(id));

    allergiesToAdd.forEach(allergyId => {
      this.drugAllergiesService.create({ drugId, allergyId }).subscribe({
        error: (err) => console.error('Greška pri dodavanju alergije:', err)
      });
    });
  }

  // ===== MODAL ZA PRIKAZ ALERGIJA =====
  viewDrugAllergies(drug: Drug) {
    this.selectedDrugForAllergies = drug;
    this.showAllergiesModal = true;
    this.isLoadingDrugAllergies = true;
    
    this.drugAllergiesService.getByDrug(drug.id).subscribe({
      next: (allergies) => {
        this.viewDrugAllergiesList = allergies;
        this.isLoadingDrugAllergies = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju alergija:', err);
        this.isLoadingDrugAllergies = false;
        this.viewDrugAllergiesList = [];
      }
    });
  }

  closeAllergiesModal() {
    this.showAllergiesModal = false;
    this.selectedDrugForAllergies = null;
    this.viewDrugAllergiesList = [];
  }
}
