import { Injectable, inject, signal } from "@angular/core";
import { Observable } from "rxjs";
import { Appointment } from "../../../shared/models/appointment.model";
import { AppointmentService } from "./appointment.service";
import { CalendarService } from "./calendar.service";
import { ToasterService } from "../../../shared/services/toaster.service";

export interface ResizeState {
  isResizing: boolean;
  appointment: Appointment | null;
  originalEndTime: string;
  newEndTime: string;
  startY: number;
  slotHeight: number;
}

export interface ResizeValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: "root",
})
export class AppointmentResizeService {
  private appointmentService = inject(AppointmentService);
  private calendarService = inject(CalendarService);
  private toasterService = inject(ToasterService);

  private resizeState = signal<ResizeState>({
    isResizing: false,
    appointment: null,
    originalEndTime: "",
    newEndTime: "",
    startY: 0,
    slotHeight: 30,
  });

  public readonly resize = this.resizeState.asReadonly();

  /**
   * Start resize operation
   */
  startResize(
    appointment: Appointment,
    startY: number,
    slotHeight: number = 30
  ): void {
    this.resizeState.set({
      isResizing: true,
      appointment,
      originalEndTime: appointment.endTime,
      newEndTime: appointment.endTime,
      startY,
      slotHeight,
    });
  }

  /**
   * Update resize position
   */
  updateResize(currentY: number): string {
    const state = this.resizeState();
    if (!state.isResizing || !state.appointment) {
      return state.newEndTime;
    }

    const delta = currentY - state.startY;
    const slotIncrements = Math.round(delta / state.slotHeight);

    // Calculate new end time
    const originalEnd = new Date(state.originalEndTime);
    const newEnd = new Date(
      originalEnd.getTime() + slotIncrements * 30 * 60 * 1000
    );

    // Validate that end time is after start time
    const startTime = new Date(state.appointment.startTime);
    if (newEnd <= startTime) {
      // Don't allow resize below start time
      return state.newEndTime;
    }

    // Validate that end time is not in the past
    const now = new Date();
    if (newEnd < now) {
      return state.newEndTime;
    }

    // Check if new end time conflicts with lunch break
    const endTimeString = `${newEnd
      .getHours()
      .toString()
      .padStart(2, "0")}:${newEnd.getMinutes().toString().padStart(2, "0")}`;

    // Allow appointments to end exactly at lunch break start time (e.g., 12:00)
    // But don't allow them to end DURING lunch break (e.g., 12:30)
    if (this.calendarService.isLunchBreak(newEnd, endTimeString)) {
      // Check if this is exactly the lunch break start time
      const settings = this.calendarService.settings();
      if (settings) {
        const globalLunchBreak = (settings.workingHours as any)
          .globalLunchBreak;
        if (globalLunchBreak?.enabled && globalLunchBreak.applyToAllDays) {
          const lunchStart = globalLunchBreak.start;
          // If ending exactly at lunch break start time, allow it
          if (endTimeString === lunchStart) {
            // This is allowed - appointment can end at lunch break start
          } else {
            // This is during lunch break, not allowed
            return state.newEndTime;
          }
        } else {
          // Use day-specific lunch break logic
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const dayName = dayNames[newEnd.getDay()];
          const dayWorkingHours = (settings.workingHours as any)[dayName];
          if (dayWorkingHours?.lunchBreak?.enabled) {
            const lunchStart = dayWorkingHours.lunchBreak.start;
            if (endTimeString === lunchStart) {
              // This is allowed - appointment can end at lunch break start
            } else {
              // This is during lunch break, not allowed
              return state.newEndTime;
            }
          }
        }
      }
    }

    // Also check if any time between current end and new end crosses lunch break
    const currentEndTime = new Date(state.newEndTime);
    if (newEnd > currentEndTime) {
      // Extending appointment - check if any intermediate time hits lunch break
      const checkStart = new Date(
        Math.max(currentEndTime.getTime(), startTime.getTime())
      );
      for (
        let checkTime = new Date(checkStart.getTime());
        checkTime < newEnd;
        checkTime.setMinutes(checkTime.getMinutes() + 30)
      ) {
        const checkTimeString = `${checkTime
          .getHours()
          .toString()
          .padStart(2, "0")}:${checkTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        if (this.calendarService.isLunchBreak(checkTime, checkTimeString)) {
          // Found lunch break in the path - don't allow this resize
          return state.newEndTime;
        }
      }
    }

    const newEndTimeStr = newEnd.toISOString();

    this.resizeState.update((current) => ({
      ...current,
      newEndTime: newEndTimeStr,
    }));

    return newEndTimeStr;
  }

  /**
   * Validate resize operation
   */
  validateResize(): ResizeValidationResult {
    const state = this.resizeState();
    if (!state.appointment) {
      return { isValid: false, errorMessage: "No appointment selected" };
    }

    const startTime = new Date(state.appointment.startTime);
    const newEndTime = new Date(state.newEndTime);
    const now = new Date();

    // Check if end time is after start time
    if (newEndTime <= startTime) {
      return {
        isValid: false,
        errorMessage: "End time must be after start time",
      };
    }

    // Check if new end time is in the past
    if (newEndTime < now) {
      return {
        isValid: false,
        errorMessage: "Cannot resize appointment to past time",
      };
    }

    // Check if new time is during clinic hours (8 AM - 6 PM)
    // Allow appointments to end exactly at 6:00 PM (18:00)
    const hour = newEndTime.getHours();
    const minute = newEndTime.getMinutes();

    if (hour < 8 || hour > 18 || (hour === 18 && minute > 0)) {
      return {
        isValid: false,
        errorMessage: "Appointment must be within clinic hours (8 AM - 6 PM)",
      };
    }

    // Check if it's a weekend (simplified - can be extended for holidays)
    const dayOfWeek = newEndTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isValid: false,
        errorMessage: "Cannot schedule appointments on weekends",
      };
    }

    // Check if new end time conflicts with lunch break
    const endTimeString = `${newEndTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${newEndTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    if (this.calendarService.isLunchBreak(newEndTime, endTimeString)) {
      // Check if this is exactly the lunch break start time
      const settings = this.calendarService.settings();
      if (settings) {
        const globalLunchBreak = (settings.workingHours as any)
          .globalLunchBreak;
        if (globalLunchBreak?.enabled && globalLunchBreak.applyToAllDays) {
          const lunchStart = globalLunchBreak.start;
          // If ending exactly at lunch break start time, allow it
          if (endTimeString !== lunchStart) {
            return {
              isValid: false,
              errorMessage: "Cannot extend appointment into lunch break time",
            };
          }
        } else {
          // Use day-specific lunch break logic
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const dayName = dayNames[newEndTime.getDay()];
          const dayWorkingHours = (settings.workingHours as any)[dayName];
          if (dayWorkingHours?.lunchBreak?.enabled) {
            const lunchStart = dayWorkingHours.lunchBreak.start;
            if (endTimeString !== lunchStart) {
              return {
                isValid: false,
                errorMessage: "Cannot extend appointment into lunch break time",
              };
            }
          }
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Complete resize operation
   */
  completeResize(): Observable<Appointment> | null {
    const state = this.resizeState();
    if (!state.appointment) {
      return null;
    }

    const validation = this.validateResize();
    if (!validation.isValid) {
      this.toasterService.showError("Resize Failed", validation.errorMessage);
      this.cancelResize();
      return null;
    }

    // Update appointment
    const updatedAppointment: Partial<Appointment> = {
      endTime: state.newEndTime,
    };

    return this.appointmentService.updateAppointment(
      state.appointment.id,
      updatedAppointment
    );
  }

  /**
   * Cancel resize operation
   */
  cancelResize(): void {
    this.resizeState.set({
      isResizing: false,
      appointment: null,
      originalEndTime: "",
      newEndTime: "",
      startY: 0,
      slotHeight: 30,
    });
  }

  /**
   * Get formatted time for display
   */
  getFormattedTime(timeStr: string): string {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  /**
   * Calculate appointment duration in minutes
   */
  getAppointmentDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Check if time slot is in the past
   */
  isPastTimeSlot(date: Date, timeSlot: string): boolean {
    const now = new Date();
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);

    return slotTime < now;
  }

  /**
   * Check if time is during clinic hours
   * For end times, allows exactly 6:00 PM (18:00)
   * For start times, must be before 6:00 PM
   */
  isWithinClinicHours(timeStr: string, isEndTime: boolean = false): boolean {
    const time = new Date(timeStr);
    const hour = time.getHours();
    const minute = time.getMinutes();
    const day = time.getDay();

    // Check if it's a weekend
    if (day === 0 || day === 6) {
      return false;
    }

    // Check if it's within 8 AM - 6 PM
    if (hour < 8) {
      return false;
    }

    if (isEndTime) {
      // For end times, allow exactly 6:00 PM but not after
      return hour < 18 || (hour === 18 && minute === 0);
    } else {
      // For start times, must be before 6:00 PM
      return hour < 18;
    }
  }
}
