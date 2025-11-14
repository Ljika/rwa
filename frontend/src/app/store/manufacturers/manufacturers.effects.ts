import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ManufacturersService } from '../../core/services/manufacturers.service';
import * as ManufacturerActions from './manufacturers.actions';
import { mergeMap, map, catchError, of } from 'rxjs';

@Injectable()
export class ManufacturersEffects {
  private actions$ = inject(Actions);
  private manufacturersService = inject(ManufacturersService);

  loadManufacturers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ManufacturerActions.loadManufacturers),
      mergeMap(() =>
        this.manufacturersService.getAll().pipe(
          map(manufacturers => ManufacturerActions.loadManufacturersSuccess({
            manufacturers: manufacturers.map(m => ({
              ...m,
              isActive: m.isActive === undefined ? true : m.isActive
            }))
          })),
          catchError(error =>
            of(ManufacturerActions.loadManufacturersFailure({ error: error.message || 'Failed to load manufacturers' }))
          )
        )
      )
    )
  );

  addManufacturer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ManufacturerActions.addManufacturer),
      mergeMap(({ manufacturer }) => {
        const createDto = { name: manufacturer.name };
        return this.manufacturersService.create(createDto).pipe(
          map(newManufacturer => ManufacturerActions.addManufacturerSuccess({
            manufacturer: {
              ...newManufacturer,
              isActive: newManufacturer.isActive === undefined ? true : newManufacturer.isActive
            }
          })),
          catchError(error =>
            of(ManufacturerActions.addManufacturerFailure({ error: error.message || 'Failed to add manufacturer' }))
          )
        );
      })
    )
  );

  updateManufacturer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ManufacturerActions.updateManufacturer),
      mergeMap(({ manufacturer }) => {
        const updateDto = { name: manufacturer.name };
        return this.manufacturersService.update(manufacturer.id, updateDto).pipe(
          map(updatedManufacturer => ManufacturerActions.updateManufacturerSuccess({
            manufacturer: {
              ...updatedManufacturer,
              isActive: updatedManufacturer.isActive === undefined ? true : updatedManufacturer.isActive
            }
          })),
          catchError(error =>
            of(ManufacturerActions.updateManufacturerFailure({ error: error.message || 'Failed to update manufacturer' }))
          )
        );
      })
    )
  );

  deleteManufacturer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ManufacturerActions.deleteManufacturer),
      mergeMap(({ id }) =>
        this.manufacturersService.delete(id).pipe(
          map(() => ManufacturerActions.deleteManufacturerSuccess({ id })),
          catchError(error =>
            of(ManufacturerActions.deleteManufacturerFailure({ error: error.message || 'Failed to delete manufacturer' }))
          )
        )
      )
    )
  );
}
