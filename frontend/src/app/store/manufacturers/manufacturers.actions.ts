import { createAction, props } from '@ngrx/store';
import { Manufacturer } from '../../core/models/manufacturer.model';

export const loadManufacturers = createAction('[Manufacturers] Load Manufacturers');
export const loadManufacturersSuccess = createAction('[Manufacturers] Load Manufacturers Success', props<{ manufacturers: Manufacturer[] }>());
export const loadManufacturersFailure = createAction('[Manufacturers] Load Manufacturers Failure', props<{ error: any }>());

export const addManufacturer = createAction('[Manufacturers] Add Manufacturer', props<{ manufacturer: Manufacturer }>());
export const addManufacturerSuccess = createAction('[Manufacturers] Add Manufacturer Success', props<{ manufacturer: Manufacturer }>());
export const addManufacturerFailure = createAction('[Manufacturers] Add Manufacturer Failure', props<{ error: any }>());

export const updateManufacturer = createAction('[Manufacturers] Update Manufacturer', props<{ manufacturer: Manufacturer }>());
export const updateManufacturerSuccess = createAction('[Manufacturers] Update Manufacturer Success', props<{ manufacturer: Manufacturer }>());
export const updateManufacturerFailure = createAction('[Manufacturers] Update Manufacturer Failure', props<{ error: any }>());

export const deleteManufacturer = createAction('[Manufacturers] Delete Manufacturer', props<{ id: string }>());
export const deleteManufacturerSuccess = createAction('[Manufacturers] Delete Manufacturer Success', props<{ id: string }>());
export const deleteManufacturerFailure = createAction('[Manufacturers] Delete Manufacturer Failure', props<{ error: any }>());
