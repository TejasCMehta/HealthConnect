import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import { ApiService } from "../../../core/services/api.service";

export interface WorkingHours {
  start: string;
  end: string;
}

export interface WorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface Settings {
  workingHours: WorkingHours;
  holidays: string[];
  workingDays: WorkingDays;
}

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private apiService = inject(ApiService);

  /**
   * Get clinic settings
   */
  getSettings(): Observable<Settings> {
    return this.apiService.get<Settings>("/settings");
  }

  /**
   * Update clinic settings
   */
  updateSettings(settings: Settings): Observable<Settings> {
    return this.apiService.put<Settings>("/settings", settings);
  }

  /**
   * Get working hours
   */
  getWorkingHours(): Observable<WorkingHours> {
    return this.apiService.get<WorkingHours>("/settings/working-hours");
  }

  /**
   * Update working hours
   */
  updateWorkingHours(workingHours: WorkingHours): Observable<WorkingHours> {
    return this.apiService.put<WorkingHours>(
      "/settings/working-hours",
      workingHours
    );
  }

  /**
   * Get holidays
   */
  getHolidays(): Observable<string[]> {
    return this.apiService.get<string[]>("/settings/holidays");
  }

  /**
   * Add holiday
   */
  addHoliday(date: string): Observable<string[]> {
    return this.apiService.post<string[]>("/settings/holidays", { date });
  }

  /**
   * Remove holiday
   */
  removeHoliday(date: string): Observable<string[]> {
    return this.apiService.delete<string[]>(`/settings/holidays/${date}`);
  }

  /**
   * Get time slots based on working hours
   */
  getTimeSlots(): Observable<string[]> {
    return this.apiService.get<string[]>("/settings/time-slots");
  }

  /**
   * Check if date is a holiday
   */
  isHoliday(date: string): Observable<boolean> {
    return this.apiService.get<boolean>(`/settings/holidays/check/${date}`);
  }

  /**
   * Get clinic configuration
   */
  getConfiguration(): Observable<{
    clinicName: string;
    clinicAddress: string;
    clinicPhone: string;
    clinicEmail: string;
    timeZone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
  }> {
    return this.apiService.get<any>("/settings/configuration");
  }

  /**
   * Update clinic configuration
   */
  updateConfiguration(config: any): Observable<any> {
    return this.apiService.put<any>("/settings/configuration", config);
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): Observable<{
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderHours: number;
    confirmationRequired: boolean;
  }> {
    return this.apiService.get<any>("/settings/notifications");
  }

  /**
   * Update notification settings
   */
  updateNotificationSettings(settings: any): Observable<any> {
    return this.apiService.put<any>("/settings/notifications", settings);
  }

  /**
   * Get backup settings
   */
  getBackupSettings(): Observable<{
    autoBackup: boolean;
    backupFrequency: string;
    backupLocation: string;
    lastBackup: string;
  }> {
    return this.apiService.get<any>("/settings/backup");
  }

  /**
   * Update backup settings
   */
  updateBackupSettings(settings: any): Observable<any> {
    return this.apiService.put<any>("/settings/backup", settings);
  }

  /**
   * Create manual backup
   */
  createBackup(): Observable<{
    success: boolean;
    filename: string;
    size: number;
  }> {
    return this.apiService.post<any>("/settings/backup/create", {});
  }

  /**
   * Restore from backup
   */
  restoreBackup(
    filename: string
  ): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<any>("/settings/backup/restore", { filename });
  }

  /**
   * Get system information
   */
  getSystemInfo(): Observable<{
    version: string;
    buildDate: string;
    environment: string;
    uptime: number;
    memoryUsage: number;
    diskUsage: number;
  }> {
    return this.apiService.get<any>("/settings/system-info");
  }

  /**
   * Export settings
   */
  exportSettings(): Observable<Blob> {
    return this.apiService.get<Blob>("/settings/export");
  }

  /**
   * Import settings
   */
  importSettings(
    file: File
  ): Observable<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return this.apiService.post<any>("/settings/import", formData);
  }

  /**
   * Reset settings to default
   */
  resetToDefault(): Observable<Settings> {
    return this.apiService.post<Settings>("/settings/reset", {});
  }

  /**
   * Get working days
   */
  getWorkingDays(): Observable<WorkingDays> {
    return this.apiService.get<WorkingDays>("/settings/working-days");
  }

  /**
   * Update working days
   */
  updateWorkingDays(workingDays: WorkingDays): Observable<WorkingDays> {
    return this.apiService.put<WorkingDays>(
      "/settings/working-days",
      workingDays
    );
  }

  /**
   * Check if a date is a working day
   */
  isWorkingDay(date: Date): Observable<boolean> {
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[date.getDay()] as keyof WorkingDays;

    return this.getWorkingDays().pipe(
      map((workingDays: WorkingDays) => workingDays[dayName])
    );
  }

  /**
   * Generate time slots for a given date within working hours
   */
  generateTimeSlots(intervalMinutes: number = 30): string[] {
    const slots: string[] = [];

    // This will be updated to use actual working hours from the service
    const startHour = 8; // Default, will be replaced with service data
    const endHour = 18; // Default, will be replaced with service data

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }

    return slots;
  }
}
