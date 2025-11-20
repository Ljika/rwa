import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AppointmentTypesService } from '../../core/services/appointment-types.service';
import { Specialization } from '../../common/enums/specialization.enum';
import * as AppointmentTypesActions from './appointment-types.actions';

@Injectable()
export class AppointmentTypesEffects {
  private actions$ = inject(Actions);
  private appointmentTypesService = inject(AppointmentTypesService);

  // Load All
  loadAppointmentTypes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentTypesActions.loadAppointmentTypes),
      switchMap(() =>
        this.appointmentTypesService.getAll().pipe(
          map((appointmentTypes) =>
            AppointmentTypesActions.loadAppointmentTypesSuccess({ appointmentTypes })
          ),
          catchError((error) =>
            of(AppointmentTypesActions.loadAppointmentTypesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Load By Specialization
  loadAppointmentTypesBySpecialization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentTypesActions.loadAppointmentTypesBySpecialization),
      switchMap(({ specialization }) =>
        this.appointmentTypesService.getBySpecialization(specialization as Specialization).pipe(
          map((appointmentTypes) =>
            AppointmentTypesActions.loadAppointmentTypesBySpecializationSuccess({ appointmentTypes })
          ),
          catchError((error) =>
            of(AppointmentTypesActions.loadAppointmentTypesBySpecializationFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Create
  createAppointmentType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentTypesActions.createAppointmentType),
      switchMap(({ appointmentType }) =>
        this.appointmentTypesService.create(appointmentType).pipe(
          map((createdAppointmentType) =>
            AppointmentTypesActions.createAppointmentTypeSuccess({ appointmentType: createdAppointmentType })
          ),
          catchError((error) =>
            of(AppointmentTypesActions.createAppointmentTypeFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Update
  updateAppointmentType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentTypesActions.updateAppointmentType),
      switchMap(({ id, changes }) =>
        this.appointmentTypesService.update(id, changes).pipe(
          map((updatedAppointmentType) =>
            AppointmentTypesActions.updateAppointmentTypeSuccess({ appointmentType: updatedAppointmentType })
          ),
          catchError((error) =>
            of(AppointmentTypesActions.updateAppointmentTypeFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Delete
  deleteAppointmentType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppointmentTypesActions.deleteAppointmentType),
      switchMap(({ id }) =>
        this.appointmentTypesService.delete(id).pipe(
          map(() =>
            AppointmentTypesActions.deleteAppointmentTypeSuccess({ id })
          ),
          catchError((error) =>
            of(AppointmentTypesActions.deleteAppointmentTypeFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
