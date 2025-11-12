import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { UsersService } from '../../core/services/users.service';
import * as UsersActions from './users.actions';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private usersService = inject(UsersService);
  
  // Load Users Effect 
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      switchMap(() =>  // switchMap operator 
        this.usersService.getAllUsers().pipe(
          map(users => UsersActions.loadUsersSuccess({ users })),
          catchError(error => 
            of(UsersActions.loadUsersFailure({ 
              error: error.message || 'Failed to load users' 
            }))
          )
        )
      )
    )
  );

  // Delete User Effect
  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.deleteUser),
      switchMap(({ userId }) =>
        this.usersService.deleteUser(userId).pipe(
          map(() => UsersActions.deleteUserSuccess({ userId })),
          catchError(error =>
            of(UsersActions.deleteUserFailure({
              error: error.message || 'Failed to delete user'
            }))
          )
        )
      )
    )
  );
}
