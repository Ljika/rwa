import { ActionReducerMap } from '@ngrx/store';
import { AuthState, authReducer } from './auth/auth.reducer';
import { UsersState, usersReducer } from './users/users.reducer';

export interface AppState {
  auth: AuthState;
  users: UsersState;
}

export const appReducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  users: usersReducer
};
