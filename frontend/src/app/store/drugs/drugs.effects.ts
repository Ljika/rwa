import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { DrugsService } from '../../core/services/drugs.service';
import * as DrugActions from './drugs.actions';
import { mergeMap, map, catchError, of } from 'rxjs';

@Injectable()
export class DrugsEffects {
  private actions$ = inject(Actions);
  private drugsService = inject(DrugsService);

  loadDrugs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DrugActions.loadDrugs),
      mergeMap(() =>
        this.drugsService.getAll().pipe(
          map(drugs => DrugActions.loadDrugsSuccess({ drugs })),
          catchError(error =>
            of(DrugActions.loadDrugsFailure({ error: error.message || 'Failed to load drugs' }))
          )
        )
      )
    )
  );

  addDrug$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DrugActions.addDrug),
      mergeMap(({ drug }) => {
        const createDrugDto = {
          name: drug.name,
          type: drug.type,
          dosage: drug.dosage,
          description: drug.description,
          manufacturerId: drug.manufacturer?.id || ''
        };
        return this.drugsService.create(createDrugDto).pipe(
          map((newDrug: any) => DrugActions.addDrugSuccess({ drug: newDrug as import('../../core/models/drug.model').Drug })),
          catchError(error =>
            of(DrugActions.addDrugFailure({ error: error.message || 'Failed to add drug' }))
          )
        );
      })
    )
  );

  updateDrug$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DrugActions.updateDrug),
      mergeMap(({ drug }) => {
        const updateDrugDto = {
          name: drug.name,
          type: drug.type,
          dosage: drug.dosage,
          description: drug.description,
          manufacturerId: drug.manufacturer?.id || ''
        };
        return this.drugsService.update(drug.id, updateDrugDto).pipe(
          map((updatedDrug: any) => DrugActions.updateDrugSuccess({ drug: updatedDrug as import('../../core/models/drug.model').Drug })),
          catchError(error =>
            of(DrugActions.updateDrugFailure({ error: error.message || 'Failed to update drug' }))
          )
        );
      })
    )
  );

  deleteDrug$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DrugActions.deleteDrug),
      mergeMap(({ id }) =>
        this.drugsService.delete(id).pipe(
          map(() => DrugActions.deleteDrugSuccess({ id })),
          catchError(error =>
            of(DrugActions.deleteDrugFailure({ error: error.message || 'Failed to delete drug' }))
          )
        )
      )
    )
  );
}
