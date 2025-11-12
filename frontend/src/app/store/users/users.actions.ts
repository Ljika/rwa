import { createAction, props } from '@ngrx/store';
import { User } from '../../shared/models/user.model';

// Load all users
export const loadUsers = createAction('[Users] Load Users');

export const loadUsersSuccess = createAction(
  '[Users] Load Users Success',
  props<{ users: User[] }>()
);

export const loadUsersFailure = createAction(
  '[Users] Load Users Failure',
  props<{ error: string }>()
);

// Delete user
export const deleteUser = createAction(
  '[Users] Delete User',
  props<{ userId: string }>()
);

export const deleteUserSuccess = createAction(
  '[Users] Delete User Success',
  props<{ userId: string }>()
);

export const deleteUserFailure = createAction(
  '[Users] Delete User Failure',
  props<{ error: string }>()
);
