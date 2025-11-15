import { createFeatureSelector, createSelector } from '@ngrx/store';
import { therapyAdapter, TherapyState } from './therapies.reducer';

export const selectTherapyState = createFeatureSelector<TherapyState>('therapies');

const { selectAll, selectEntities, selectIds, selectTotal } = therapyAdapter.getSelectors();

export const selectAllTherapies = createSelector(selectTherapyState, selectAll);
export const selectTherapyEntities = createSelector(selectTherapyState, selectEntities);
export const selectTherapyIds = createSelector(selectTherapyState, selectIds);
export const selectTherapyTotal = createSelector(selectTherapyState, selectTotal);
export const selectTherapiesLoading = createSelector(
  selectTherapyState,
  state => state.loading
);
export const selectTherapiesError = createSelector(
  selectTherapyState,
  state => state.error
);
