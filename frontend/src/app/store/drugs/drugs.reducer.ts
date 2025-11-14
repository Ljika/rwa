import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import * as DrugActions from './drugs.actions';
import { Drug } from '../../core/models/drug.model';

export interface DrugState extends EntityState<Drug> {
  loading: boolean;
  error: string | null;
}

export const drugAdapter = createEntityAdapter<Drug>();

export const initialState: DrugState = drugAdapter.getInitialState({
  loading: false,
  error: null
});

export const drugsReducer = createReducer(
  initialState,

  // Load Drugs
  on(DrugActions.loadDrugs, state => ({ ...state, loading: true, error: null })),
  on(DrugActions.loadDrugsSuccess, (state, { drugs }) =>
    drugAdapter.setAll(drugs, { ...state, loading: false, error: null })
  ),
  on(DrugActions.loadDrugsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  // Add Drug
  on(DrugActions.addDrugSuccess, (state, { drug }) =>
    drugAdapter.addOne(drug, { ...state })
  ),

  // Update Drug
  on(DrugActions.updateDrugSuccess, (state, { drug }) =>
    drugAdapter.updateOne({ id: drug.id, changes: drug }, { ...state })
  ),

  // Delete Drug
  on(DrugActions.deleteDrugSuccess, (state, { id }) =>
    drugAdapter.removeOne(id, { ...state })
  )
);
