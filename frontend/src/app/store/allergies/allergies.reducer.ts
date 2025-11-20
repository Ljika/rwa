import { createReducer, on } from '@ngrx/store';
import { Allergy } from '../../core/models/allergy.model';
import * as AllergiesActions from './allergies.actions';

export interface AllergiesState {
  allergies: Allergy[];
  loading: boolean;
  error: string | null;
}

export const initialState: AllergiesState = {
  allergies: [],
  loading: false,
  error: null
};

export const allergiesReducer = createReducer(
  initialState,

  // Load Allergies
  on(AllergiesActions.loadAllergies, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AllergiesActions.loadAllergiesSuccess, (state, { allergies }) => ({
    ...state,
    allergies,
    loading: false,
    error: null
  })),
  on(AllergiesActions.loadAllergiesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add Allergy
  on(AllergiesActions.addAllergy, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AllergiesActions.addAllergySuccess, (state, { allergy }) => ({
    ...state,
    allergies: [...state.allergies, allergy].sort((a, b) => a.name.localeCompare(b.name)),
    loading: false,
    error: null
  })),
  on(AllergiesActions.addAllergyFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Allergy
  on(AllergiesActions.updateAllergy, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AllergiesActions.updateAllergySuccess, (state, { allergy }) => ({
    ...state,
    allergies: state.allergies
      .map(a => a.id === allergy.id ? allergy : a)
      .sort((a, b) => a.name.localeCompare(b.name)),
    loading: false,
    error: null
  })),
  on(AllergiesActions.updateAllergyFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Allergy
  on(AllergiesActions.deleteAllergy, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AllergiesActions.deleteAllergySuccess, (state, { id }) => ({
    ...state,
    allergies: state.allergies.filter(a => a.id !== id),
    loading: false,
    error: null
  })),
  on(AllergiesActions.deleteAllergyFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
