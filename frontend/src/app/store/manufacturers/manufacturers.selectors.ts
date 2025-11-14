import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ManufacturerState, manufacturerAdapter } from './manufacturers.reducer';

export const selectManufacturerState = createFeatureSelector<ManufacturerState>('manufacturers');

const { selectAll, selectEntities, selectIds, selectTotal } = manufacturerAdapter.getSelectors();

export const selectAllManufacturers = createSelector(
  selectManufacturerState,
  selectAll
);

export const selectManufacturerEntities = createSelector(
  selectManufacturerState,
  selectEntities
);

export const selectManufacturerIds = createSelector(
  selectManufacturerState,
  selectIds
);

export const selectManufacturerTotal = createSelector(
  selectManufacturerState,
  selectTotal
);

export const selectManufacturersLoading = createSelector(
  selectManufacturerState,
  state => state.loading
);

export const selectManufacturersError = createSelector(
  selectManufacturerState,
  state => state.error
);
