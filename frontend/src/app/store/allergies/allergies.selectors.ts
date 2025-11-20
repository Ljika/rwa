import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AllergiesState } from './allergies.reducer';

export const selectAllergiesState = createFeatureSelector<AllergiesState>('allergies');

export const selectAllAllergies = createSelector(
  selectAllergiesState,
  (state) => state.allergies
);

export const selectAllergiesLoading = createSelector(
  selectAllergiesState,
  (state) => state.loading
);

export const selectAllergiesError = createSelector(
  selectAllergiesState,
  (state) => state.error
);

export const selectAllergyById = (id: string) => createSelector(
  selectAllAllergies,
  (allergies) => allergies.find(allergy => allergy.id === id)
);
