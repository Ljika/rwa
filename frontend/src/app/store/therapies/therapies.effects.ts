import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TherapiesService } from '../../core/services/therapies.service';
import * as TherapyActions from './therapies.actions';

@Injectable()
export class TherapiesEffects {
  private actions$ = inject(Actions);
  private therapiesService = inject(TherapiesService);

  // Load My Therapies (Patient)
  loadMyTherapies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TherapyActions.loadMyTherapies),
      switchMap(() => {
        console.log('Effect: Loading my therapies...');
        return this.therapiesService.getMyTherapies().pipe(
          map(therapies => {
            console.log('Effect: Therapies loaded successfully:', therapies);
            return TherapyActions.loadMyTherapiesSuccess({ therapies });
          }),
          catchError(error => {
            console.error('Effect: Error loading therapies:', error);
            return of(TherapyActions.loadMyTherapiesFailure({ error: error.message }));
          })
        );
      })
    )
  );

  // Load My Prescribed Therapies (Doctor)
  loadMyPrescribedTherapies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TherapyActions.loadMyPrescribedTherapies),
      switchMap(() =>
        this.therapiesService.getMyPrescribedTherapies().pipe(
          map(therapies => TherapyActions.loadMyPrescribedTherapiesSuccess({ therapies })),
          catchError(error => of(TherapyActions.loadMyPrescribedTherapiesFailure({ error: error.message })))
        )
      )
    )
  );

  // Load All Therapies (Admin)
  loadAllTherapies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TherapyActions.loadAllTherapies),
      switchMap(() =>
        this.therapiesService.getAllTherapies().pipe(
          map(therapies => TherapyActions.loadAllTherapiesSuccess({ therapies })),
          catchError(error => of(TherapyActions.loadAllTherapiesFailure({ error: error.message })))
        )
      )
    )
  );

  // Add Therapy
  addTherapy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TherapyActions.addTherapy),
      switchMap(({ therapy }) =>
        this.therapiesService.createTherapy(therapy).pipe(
          map(newTherapy => TherapyActions.addTherapySuccess({ therapy: newTherapy })),
          catchError(error => of(TherapyActions.addTherapyFailure({ error: error.message })))
        )
      )
    )
  );

  // Delete Therapy
  deleteTherapy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TherapyActions.deleteTherapy),
      switchMap(({ id }) =>
        this.therapiesService.deleteTherapy(id).pipe(
          map(() => TherapyActions.deleteTherapySuccess({ id })),
          catchError(error => of(TherapyActions.deleteTherapyFailure({ error: error.message })))
        )
      )
    )
  );
}
