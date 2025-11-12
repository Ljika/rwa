import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState, adapter } from './users.reducer';
import { UserRole } from '../../shared/models/user.model';

// Feature Selector
export const selectUsersState = createFeatureSelector<UsersState>('users');

// Adapter selektori - adapter daje selectAll, selectIds, selectEntities
const { selectAll, selectIds, selectEntities } = adapter.getSelectors();

// Svi korisnici
export const selectAllUsers = createSelector(
  selectUsersState,
  selectAll  // adapter.getSelectors().selectAll
);

// Loading state
export const selectUsersLoading = createSelector(
  selectUsersState,
  (state) => state.loading
);

// Error state
export const selectUsersError = createSelector(
  selectUsersState,
  (state) => state.error
);

// Filtriranje pacijenata 
export const selectPatients = createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.role === UserRole.Patient)
);

// Filtriranje doktora
export const selectDoctors = createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.role === UserRole.Doctor)
);

// Filtriranje admina
export const selectAdmins = createSelector(
  selectAllUsers,
  (users) => users.filter(user => user.role === UserRole.Admin)
);

// Broj pacijenata
export const selectPatientsCount = createSelector(
  selectPatients,
  (patients) => patients.length
);

// Broj doktora
export const selectDoctorsCount = createSelector(
  selectDoctors,
  (doctors) => doctors.length
);
