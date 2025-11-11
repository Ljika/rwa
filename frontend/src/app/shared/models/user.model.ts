export enum UserRole {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Patient = 'Patient'
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  gender?: Gender;
  dateOfBirth?: string;
  phoneNumber?: string;
  specialization?: string;  
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  gender?: Gender;
  dateOfBirth?: string;
  phoneNumber?: string;
  specialization?: string;  
}

export interface AuthResponse {
  accessToken: string;  
  user: User;
}
