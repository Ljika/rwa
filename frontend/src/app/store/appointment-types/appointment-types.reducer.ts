import { createReducer, on } from '@ngrx/store';
import { AppointmentType } from '../../core/models/appointment-type.model';
import * as AppointmentTypesActions from './appointment-types.actions';

export interface AppointmentTypesState {
  appointmentTypes: AppointmentType[];
  loading: boolean;
  error: string | null;
}

export const initialState: AppointmentTypesState = {
  appointmentTypes: [],
  loading: false,
  error: null,
};

export const appointmentTypesReducer = createReducer(
  initialState,

  // Load All
  on(AppointmentTypesActions.loadAppointmentTypes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AppointmentTypesActions.loadAppointmentTypesSuccess, (state, { appointmentTypes }) => ({
    ...state,
    appointmentTypes,
    loading: false,
  })),
  on(AppointmentTypesActions.loadAppointmentTypesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load By Specialization
  on(AppointmentTypesActions.loadAppointmentTypesBySpecialization, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AppointmentTypesActions.loadAppointmentTypesBySpecializationSuccess, (state, { appointmentTypes }) => ({
    ...state,
    appointmentTypes,
    loading: false,
  })),
  on(AppointmentTypesActions.loadAppointmentTypesBySpecializationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create
  on(AppointmentTypesActions.createAppointmentType, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AppointmentTypesActions.createAppointmentTypeSuccess, (state, { appointmentType }) => ({
    ...state,
    appointmentTypes: [...state.appointmentTypes, appointmentType],
    loading: false,
  })),
  on(AppointmentTypesActions.createAppointmentTypeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update
  on(AppointmentTypesActions.updateAppointmentType, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AppointmentTypesActions.updateAppointmentTypeSuccess, (state, { appointmentType }) => ({
    ...state,
    appointmentTypes: state.appointmentTypes.map((at) =>
      at.id === appointmentType.id ? appointmentType : at
    ),
    loading: false,
  })),
  on(AppointmentTypesActions.updateAppointmentTypeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete
  on(AppointmentTypesActions.deleteAppointmentType, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AppointmentTypesActions.deleteAppointmentTypeSuccess, (state, { id }) => ({
    ...state,
    appointmentTypes: state.appointmentTypes.filter((at) => at.id !== id),
    loading: false,
  })),
  on(AppointmentTypesActions.deleteAppointmentTypeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
