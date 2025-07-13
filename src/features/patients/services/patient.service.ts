import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Patient, PatientResponse } from '../../../shared/models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiService = inject(ApiService);
  
  /**
   * Get patients with pagination and filtering
   */
  getPatients(params?: {
    _page?: number;
    _limit?: number;
    _sort?: string;
    _order?: 'asc' | 'desc';
    q?: string;
  }): Observable<PatientResponse> {
    return this.apiService.get<PatientResponse>('/patients', params);
  }
  
  /**
   * Get patient by ID
   */
  getPatient(id: number): Observable<Patient> {
    return this.apiService.get<Patient>(`/patients/${id}`);
  }
  
  /**
   * Create a new patient
   */
  createPatient(patient: Omit<Patient, 'id'>): Observable<Patient> {
    return this.apiService.post<Patient>('/patients', patient);
  }
  
  /**
   * Update an existing patient
   */
  updatePatient(id: number, patient: Partial<Patient>): Observable<Patient> {
    return this.apiService.put<Patient>(`/patients/${id}`, patient);
  }
  
  /**
   * Delete a patient
   */
  deletePatient(id: number): Observable<void> {
    return this.apiService.delete<void>(`/patients/${id}`);
  }
  
  /**
   * Delete multiple patients
   */
  deleteMultiplePatients(ids: number[]): Observable<void> {
    // Since json-server doesn't support bulk delete, we'll simulate it
    return new Observable(observer => {
      const deletePromises = ids.map(id => 
        this.apiService.delete<void>(`/patients/${id}`).toPromise()
      );
      
      Promise.all(deletePromises)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
  
  /**
   * Search patients
   */
  searchPatients(query: string): Observable<Patient[]> {
    return this.apiService.get<Patient[]>('/patients', { q: query });
  }
  
  /**
   * Get patient statistics
   */
  getPatientStats(): Observable<{
    total: number;
    newThisMonth: number;
    byAgeGroup: Record<string, number>;
  }> {
    return this.apiService.get<any>('/patients/stats');
  }
  
  /**
   * Export patients to CSV
   */
  exportPatients(): Observable<Blob> {
    return this.apiService.get<Blob>('/patients/export');
  }
  
  /**
   * Import patients from CSV
   */
  importPatients(file: File): Observable<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.apiService.post<{ success: number; errors: string[] }>('/patients/import', formData);
  }
}
