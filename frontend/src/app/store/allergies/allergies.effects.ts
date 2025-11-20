import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AllergiesService } from '../../core/services/allergies.service';
import * as AllergiesActions from './allergies.actions';

@Injectable()
export class AllergiesEffects {
  private actions$ = inject(Actions);
  private allergiesService = inject(AllergiesService);

  loadAllergies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AllergiesActions.loadAllergies),
      switchMap(() =>
        this.allergiesService.getAll().pipe(
          map(allergies => AllergiesActions.loadAllergiesSuccess({ allergies })),
          catchError(error => of(AllergiesActions.loadAllergiesFailure({ 
            error: error.message || 'Greška pri učitavanju alergija' 
          })))
        )
      )
    )
  );

  addAllergy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AllergiesActions.addAllergy),
      switchMap(({ name }) =>
        this.allergiesService.create(name).pipe(
          map(allergy => AllergiesActions.addAllergySuccess({ allergy })),
          catchError(error => of(AllergiesActions.addAllergyFailure({ 
            error: error.error?.message || 'Greška pri kreiranju alergije' 
          })))
        )
      )
    )
  );

  updateAllergy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AllergiesActions.updateAllergy),
      switchMap(({ id, name }) =>
        this.allergiesService.update(id, name).pipe(
          map(allergy => AllergiesActions.updateAllergySuccess({ allergy })),
          catchError(error => of(AllergiesActions.updateAllergyFailure({ 
            error: error.error?.message || 'Greška pri ažuriranju alergije' 
          })))
        )
      )
    )
  );

  deleteAllergy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AllergiesActions.deleteAllergy),
      switchMap(({ id }) =>
        this.allergiesService.delete(id).pipe(
          map(() => AllergiesActions.deleteAllergySuccess({ id })),
          catchError(error => of(AllergiesActions.deleteAllergyFailure({ 
            error: error.error?.message || 'Greška pri brisanju alergije' 
          })))
        )
      )
    )
  );
}
