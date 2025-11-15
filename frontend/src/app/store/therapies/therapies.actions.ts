import { createAction, props } from '@ngrx/store';
import { Therapy } from '../../core/models/therapy.model';

// Load Therapies (Patient)
export const loadMyTherapies = createAction('[Therapies] Load My Therapies');
export const loadMyTherapiesSuccess = createAction(
  '[Therapies] Load My Therapies Success',
  props<{ therapies: Therapy[] }>()
);
export const loadMyTherapiesFailure = createAction(
  '[Therapies] Load My Therapies Failure',
  props<{ error: string }>()
);

// Load Prescribed Therapies (Doctor)
export const loadMyPrescribedTherapies = createAction('[Therapies] Load My Prescribed Therapies');
export const loadMyPrescribedTherapiesSuccess = createAction(
  '[Therapies] Load My Prescribed Therapies Success',
  props<{ therapies: Therapy[] }>()
);
export const loadMyPrescribedTherapiesFailure = createAction(
  '[Therapies] Load My Prescribed Therapies Failure',
  props<{ error: string }>()
);

// Load All Therapies (Admin)
export const loadAllTherapies = createAction('[Therapies] Load All Therapies');
export const loadAllTherapiesSuccess = createAction(
  '[Therapies] Load All Therapies Success',
  props<{ therapies: Therapy[] }>()
);
export const loadAllTherapiesFailure = createAction(
  '[Therapies] Load All Therapies Failure',
  props<{ error: string }>()
);

// Add Therapy
export const addTherapy = createAction(
  '[Therapies] Add Therapy',
  props<{ therapy: any }>()
);
export const addTherapySuccess = createAction(
  '[Therapies] Add Therapy Success',
  props<{ therapy: Therapy }>()
);
export const addTherapyFailure = createAction(
  '[Therapies] Add Therapy Failure',
  props<{ error: string }>()
);

// Delete Therapy
export const deleteTherapy = createAction(
  '[Therapies] Delete Therapy',
  props<{ id: string }>()
);
export const deleteTherapySuccess = createAction(
  '[Therapies] Delete Therapy Success',
  props<{ id: string }>()
);
export const deleteTherapyFailure = createAction(
  '[Therapies] Delete Therapy Failure',
  props<{ error: string }>()
);
