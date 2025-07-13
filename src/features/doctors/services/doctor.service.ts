import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Doctor } from '../../../shared/models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiService = inject(ApiService);
  
  /**
   * Get all doctors
   */
  getDoctors(): Observable<Doctor[]> {
    return this.apiService.get<Doctor[]>('/doctors');
  }
  
  /**
   * Get doctor by ID
   */
  getDoctor(id: number): Observable<Doctor> {
    return this.apiService.get<Doctor>(`/doctors/${id}`);
  }
  
  /**
   * Create a new doctor
   */
  createDoctor(doctor: Omit<Doctor, 'id'>): Observable<Doctor> {
    return this.apiService.post<Doctor>('/doctors', doctor);
  }
  
  /**
   * Update an existing doctor
   */
  updateDoctor(id: number, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.apiService.put<Doctor>(`/doctors/${id}`, doctor);
  }
  
  /**
   * Delete a doctor
   */
  deleteDoctor(id: number): Observable<void> {
    return this.apiService.delete<void>(`/doctors/${id}`);
  }
  
  /**
   * Get doctors by specialty
   */
  getDoctorsBySpecialty(specialty: string): Observable<Doctor[]> {
    return this.apiService.get<Doctor[]>('/doctors', { specialty });
  }
  
  /**
   * Search doctors
   */
  searchDoctors(query: string): Observable<Doctor[]> {
    return this.apiService.get<Doctor[]>('/doctors', { q: query });
  }
  
  /**
   * Get doctor statistics
   */
  getDoctorStats(): Observable<{
    total: number;
    bySpecialty: Record<string, number>;
    activeToday: number;
  }> {
    return this.apiService.get<any>('/doctors/stats');
  }
  
  /**
   * Get available time slots for a doctor
   */
  getAvailableTimeSlots(doctorId: number, date: string): Observable<string[]> {
    return this.apiService.get<string[]>(`/doctors/${doctorId}/available-slots`, { date });
  }
  
  /**
   * Get doctor's schedule
   */
  getDoctorSchedule(doctorId: number, startDate: string, endDate: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/doctors/${doctorId}/schedule`, { startDate, endDate });
  }
}
