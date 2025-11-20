import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppointmentTypesState } from './appointment-types.reducer';

export const selectAppointmentTypesState = createFeatureSelector<AppointmentTypesState>('appointmentTypes');

export const selectAllAppointmentTypes = createSelector(
  selectAppointmentTypesState,
  (state) => state.appointmentTypes
);

export const selectAppointmentTypesLoading = createSelector(
  selectAppointmentTypesState,
  (state) => state.loading
);

export const selectAppointmentTypesError = createSelector(
  selectAppointmentTypesState,
  (state) => state.error
);

export const selectActiveAppointmentTypes = createSelector(
  selectAllAppointmentTypes,
  (appointmentTypes) => appointmentTypes.filter((at) => at.isActive)
);

export const selectAppointmentTypesBySpecialization = (specialization: string) =>
  createSelector(selectActiveAppointmentTypes, (appointmentTypes) =>
    appointmentTypes.filter((at) => at.specialization === specialization)
  );
