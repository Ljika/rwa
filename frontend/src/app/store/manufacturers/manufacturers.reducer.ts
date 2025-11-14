import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import * as ManufacturerActions from './manufacturers.actions';
import { Manufacturer } from '../../core/models/manufacturer.model';

export interface ManufacturerState extends EntityState<Manufacturer> {
	loading: boolean;
	error: string | null;
}

export const manufacturerAdapter = createEntityAdapter<Manufacturer>();

export const initialState: ManufacturerState = manufacturerAdapter.getInitialState({
	loading: false,
	error: null
});

export const manufacturersReducer = createReducer(
	initialState,
	on(ManufacturerActions.loadManufacturers, state => ({ ...state, loading: true, error: null })),
	on(ManufacturerActions.loadManufacturersSuccess, (state, { manufacturers }) =>
		manufacturerAdapter.setAll(manufacturers, { ...state, loading: false, error: null })
	),
	on(ManufacturerActions.loadManufacturersFailure, (state, { error }) => ({ ...state, loading: false, error })),

	on(ManufacturerActions.addManufacturerSuccess, (state, { manufacturer }) =>
		manufacturerAdapter.addOne(manufacturer, { ...state })
	),

	on(ManufacturerActions.updateManufacturerSuccess, (state, { manufacturer }) =>
		manufacturerAdapter.updateOne({ id: manufacturer.id, changes: manufacturer }, { ...state })
	),

	on(ManufacturerActions.deleteManufacturerSuccess, (state, { id }) =>
		manufacturerAdapter.removeOne(id, { ...state })
	)
);
