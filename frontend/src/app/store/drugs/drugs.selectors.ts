import { createFeatureSelector, createSelector } from '@ngrx/store';
import { drugAdapter, DrugState } from './drugs.reducer';

export const selectDrugState = createFeatureSelector<DrugState>('drugs');

const { selectAll, selectEntities, selectIds, selectTotal } = drugAdapter.getSelectors();

export const selectAllDrugs = createSelector(selectDrugState, selectAll);
export const selectDrugEntities = createSelector(selectDrugState, selectEntities);
export const selectDrugIds = createSelector(selectDrugState, selectIds);
export const selectDrugTotal = createSelector(selectDrugState, selectTotal);
export const selectDrugsLoading = createSelector(
  selectDrugState,
  state => state.loading
);
export const selectDrugsError = createSelector(
  selectDrugState,
  state => state.error
);
