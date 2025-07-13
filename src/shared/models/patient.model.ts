export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
}

export interface PatientResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
