import { createAction, props } from '@ngrx/store';
import { Allergy } from '../../core/models/allergy.model';

// Load All Allergies
export const loadAllergies = createAction('[Allergies] Load Allergies');
export const loadAllergiesSuccess = createAction(
  '[Allergies] Load Allergies Success',
  props<{ allergies: Allergy[] }>()
);
export const loadAllergiesFailure = createAction(
  '[Allergies] Load Allergies Failure',
  props<{ error: string }>()
);

// Add Allergy
export const addAllergy = createAction(
  '[Allergies] Add Allergy',
  props<{ name: string }>()
);
export const addAllergySuccess = createAction(
  '[Allergies] Add Allergy Success',
  props<{ allergy: Allergy }>()
);
export const addAllergyFailure = createAction(
  '[Allergies] Add Allergy Failure',
  props<{ error: string }>()
);

// Update Allergy
export const updateAllergy = createAction(
  '[Allergies] Update Allergy',
  props<{ id: string; name: string }>()
);
export const updateAllergySuccess = createAction(
  '[Allergies] Update Allergy Success',
  props<{ allergy: Allergy }>()
);
export const updateAllergyFailure = createAction(
  '[Allergies] Update Allergy Failure',
  props<{ error: string }>()
);

// Delete Allergy
export const deleteAllergy = createAction(
  '[Allergies] Delete Allergy',
  props<{ id: string }>()
);
export const deleteAllergySuccess = createAction(
  '[Allergies] Delete Allergy Success',
  props<{ id: string }>()
);
export const deleteAllergyFailure = createAction(
  '[Allergies] Delete Allergy Failure',
  props<{ error: string }>()
);
