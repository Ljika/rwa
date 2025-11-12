import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { User } from '../../shared/models/user.model';
import * as UsersActions from './users.actions';

// EntityState sa dodatnim poljima
export interface UsersState extends EntityState<User> {
  loading: boolean;
  error: string | null;
}

// Kreiranje adaptera 
export const adapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: (user: User) => user.id,
  sortComparer: false, // Ne sortiramo automatski
});

// Početno stanje - adapter.getInitialState() 
export const initialState: UsersState = adapter.getInitialState({
  loading: false,
  error: null,
});

export const usersReducer = createReducer(
  initialState,
  
  // Load Users
  on(UsersActions.loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  
  on(UsersActions.loadUsersSuccess, (state, { users }) =>
    adapter.setAll(users, {  // adapter.setAll umesto ručnog dodavanja
      ...state,
      loading: false,
      error: null,
    })
  ),
  
  on(UsersActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  
  // Delete User
  on(UsersActions.deleteUser, (state) => ({
    ...state,
    loading: true,
  })),
  
  on(UsersActions.deleteUserSuccess, (state, { userId }) =>
    adapter.removeOne(userId, {  // adapter.removeOne 
      ...state,
      loading: false,
    })
  ),
  
  on(UsersActions.deleteUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
