import { Injectable, inject } from "@angular/core";
import { Observable, forkJoin, map, switchMap } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { PatientService } from "../../patients/services/patient.service";
import { DoctorService } from "../../doctors/services/doctor.service";
import { Appointment } from "../../../shared/models/appointment.model";

@Injectable({
  providedIn: "root",
})
export class AppointmentService {
  private apiService = inject(ApiService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  /**
   * Get all appointments with patient and doctor details
   */
  getAppointments(): Observable<Appointment[]> {
    return this.apiService.get<Appointment[]>("/appointments").pipe(
      switchMap((appointments) => {
        if (appointments.length === 0) {
          return [appointments];
        }

        // Get unique patient and doctor IDs
        const patientIds = [
          ...new Set(appointments.map((apt) => apt.patientId)),
        ];
        const doctorIds = [...new Set(appointments.map((apt) => apt.doctorId))];

        // Fetch all patients and doctors
        const patients$ = forkJoin(
          patientIds.map((id) => this.patientService.getPatient(id))
        );
        const doctors$ = forkJoin(
          doctorIds.map((id) => this.doctorService.getDoctor(id))
        );

        return forkJoin([patients$, doctors$]).pipe(
          map(([patients, doctors]) => {
            // Create lookup maps
            const patientsMap = new Map(patients.map((p) => [p.id, p]));
            const doctorsMap = new Map(doctors.map((d) => [d.id, d]));

            // Merge appointment data with patient and doctor details
            return appointments.map((appointment) => ({
              ...appointment,
              patient: patientsMap.get(appointment.patientId),
              doctor: doctorsMap.get(appointment.doctorId),
            }));
          })
        );
      })
    );
  }

  /**
   * Get appointment by ID
   */
  getAppointment(id: number): Observable<Appointment> {
    return this.apiService.get<Appointment>(`/appointments/${id}`);
  }

  /**
   * Create a new appointment
   */
  createAppointment(
    appointment: Omit<Appointment, "id">
  ): Observable<Appointment> {
    return this.apiService.post<Appointment>("/appointments", appointment);
  }

  /**
   * Update an existing appointment
   */
  updateAppointment(
    id: number,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    return this.apiService.put<Appointment>(`/appointments/${id}`, appointment);
  }

  /**
   * Delete an appointment
   */
  deleteAppointment(id: number): Observable<void> {
    return this.apiService.delete<void>(`/appointments/${id}`);
  }

  /**
   * Get appointments for a specific date
   */
  getAppointmentsByDate(date: Date): Observable<Appointment[]> {
    const dateStr = date.toISOString().split("T")[0];
    return this.apiService.get<Appointment[]>(`/appointments?date=${dateStr}`);
  }

  /**
   * Get appointments for a specific doctor
   */
  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.apiService.get<Appointment[]>(
      `/appointments?doctorId=${doctorId}`
    );
  }

  /**
   * Get appointments for a specific patient
   */
  getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
    return this.apiService.get<Appointment[]>(
      `/appointments?patientId=${patientId}`
    );
  }

  /**
   * Get appointments within a date range
   */
  getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<Appointment[]> {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    return this.apiService.get<Appointment[]>(
      `/appointments?startDate=${start}&endDate=${end}`
    );
  }

  /**
   * Validate appointment time slot
   */
  validateAppointmentTime(
    doctorId: number,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): Observable<{ valid: boolean; conflicts: Appointment[] }> {
    const params = {
      doctorId,
      startTime,
      endTime,
      ...(excludeId && { excludeId }),
    };

    return this.apiService.get<{ valid: boolean; conflicts: Appointment[] }>(
      "/appointments/validate",
      params
    );
  }

  /**
   * Get appointment statistics
   */
  getAppointmentStats(): Observable<{
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
  }> {
    return this.apiService.get<any>("/appointments/stats");
  }

  /**
   * Reschedule an appointment
   */
  rescheduleAppointment(
    id: number,
    newStartTime: string,
    newEndTime: string
  ): Observable<Appointment> {
    return this.apiService.put<Appointment>(`/appointments/${id}/reschedule`, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }

  /**
   * Cancel an appointment
   */
  cancelAppointment(id: number, reason?: string): Observable<Appointment> {
    return this.apiService.put<Appointment>(`/appointments/${id}/cancel`, {
      reason,
    });
  }

  /**
   * Mark appointment as completed
   */
  completeAppointment(id: number, notes?: string): Observable<Appointment> {
    return this.apiService.put<Appointment>(`/appointments/${id}/complete`, {
      notes,
    });
  }
}
