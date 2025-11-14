import { createAction, props } from '@ngrx/store';
import { Drug } from '../../core/models/drug.model';

// Load Drugs
export const loadDrugs = createAction('[Drugs] Load Drugs');
export const loadDrugsSuccess = createAction(
  '[Drugs] Load Drugs Success',
  props<{ drugs: Drug[] }>()
);
export const loadDrugsFailure = createAction(
  '[Drugs] Load Drugs Failure',
  props<{ error: string }>()
);

// Add Drug
export const addDrug = createAction(
  '[Drugs] Add Drug',
  props<{ drug: Drug }>()
);
export const addDrugSuccess = createAction(
  '[Drugs] Add Drug Success',
  props<{ drug: Drug }>()
);
export const addDrugFailure = createAction(
  '[Drugs] Add Drug Failure',
  props<{ error: string }>()
);

// Update Drug
export const updateDrug = createAction(
  '[Drugs] Update Drug',
  props<{ drug: Drug }>()
);
export const updateDrugSuccess = createAction(
  '[Drugs] Update Drug Success',
  props<{ drug: Drug }>()
);
export const updateDrugFailure = createAction(
  '[Drugs] Update Drug Failure',
  props<{ error: string }>()
);

// Delete Drug
export const deleteDrug = createAction(
  '[Drugs] Delete Drug',
  props<{ id: string }>()
);
export const deleteDrugSuccess = createAction(
  '[Drugs] Delete Drug Success',
  props<{ id: string }>()
);
export const deleteDrugFailure = createAction(
  '[Drugs] Delete Drug Failure',
  props<{ error: string }>()
);
