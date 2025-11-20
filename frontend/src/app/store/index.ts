import { ActionReducerMap } from '@ngrx/store';
import { AuthState, authReducer } from './auth/auth.reducer';
import { UsersState, usersReducer } from './users/users.reducer';
import { DrugState, drugsReducer } from './drugs/drugs.reducer';
import { ManufacturerState, manufacturersReducer } from './manufacturers/manufacturers.reducer';
import { TherapyState, therapiesReducer } from './therapies/therapies.reducer';
import { AllergiesState, allergiesReducer } from './allergies/allergies.reducer';

export interface AppState {
  auth: AuthState;
  users: UsersState;
  drugs: DrugState;
  manufacturers: ManufacturerState;
  therapies: TherapyState;
  allergies: AllergiesState;
}

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  users: usersReducer,
  drugs: drugsReducer,
  manufacturers: manufacturersReducer,
  therapies: therapiesReducer,
  allergies: allergiesReducer
};
