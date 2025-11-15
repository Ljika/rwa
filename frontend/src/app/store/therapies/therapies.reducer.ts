import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import * as TherapyActions from './therapies.actions';
import { Therapy } from '../../core/models/therapy.model';

export interface TherapyState extends EntityState<Therapy> {
  loading: boolean;
  error: string | null;
}

export const therapyAdapter = createEntityAdapter<Therapy>();

export const initialState: TherapyState = therapyAdapter.getInitialState({
  loading: false,
  error: null
});

export const therapiesReducer = createReducer(
  initialState,

  // Load My Therapies (Patient)
  on(TherapyActions.loadMyTherapies, state => ({ ...state, loading: true, error: null })),
  on(TherapyActions.loadMyTherapiesSuccess, (state, { therapies }) =>
    therapyAdapter.setAll(therapies, { ...state, loading: false, error: null })
  ),
  on(TherapyActions.loadMyTherapiesFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Load My Prescribed Therapies (Doctor)
  on(TherapyActions.loadMyPrescribedTherapies, state => ({ ...state, loading: true, error: null })),
  on(TherapyActions.loadMyPrescribedTherapiesSuccess, (state, { therapies }) =>
    therapyAdapter.setAll(therapies, { ...state, loading: false, error: null })
  ),
  on(TherapyActions.loadMyPrescribedTherapiesFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Load All Therapies (Admin)
  on(TherapyActions.loadAllTherapies, state => ({ ...state, loading: true, error: null })),
  on(TherapyActions.loadAllTherapiesSuccess, (state, { therapies }) =>
    therapyAdapter.setAll(therapies, { ...state, loading: false, error: null })
  ),
  on(TherapyActions.loadAllTherapiesFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Add Therapy
  on(TherapyActions.addTherapySuccess, (state, { therapy }) =>
    therapyAdapter.addOne(therapy, { ...state })
  ),

  // Delete Therapy
  on(TherapyActions.deleteTherapySuccess, (state, { id }) =>
    therapyAdapter.removeOne(id, { ...state })
  )
);
