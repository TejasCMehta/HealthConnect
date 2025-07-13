import { Injectable, inject, signal } from "@angular/core";
import { Observable, of } from "rxjs";
import { Appointment } from "../../../shared/models/appointment.model";
import { Doctor } from "../../../shared/models/doctor.model";
import { AppointmentService } from "./appointment.service";
import { ToasterService } from "../../../shared/services/toaster.service";

export interface DragState {
  isDragging: boolean;
  appointment: Appointment | null;
  originalStartTime: string;
  originalEndTime: string;
  originalDoctorId: number;
  newStartTime: string;
  newEndTime: string;
  newDoctorId: number;
  startX: number;
  startY: number;
  slotHeight: number;
  currentX: number;
  currentY: number;
  isValidTarget: boolean;
}

export interface DragValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface DragDropConfirmation {
  appointment: Appointment;
  newStartTime: string;
  newEndTime: string;
  newDoctorId: number;
  newDoctor?: Doctor;
  changes: {
    timeChanged: boolean;
    doctorChanged: boolean;
  };
}

@Injectable({
  providedIn: "root",
})
export class AppointmentDragDropService {
  private appointmentService = inject(AppointmentService);
  private toasterService = inject(ToasterService);

  private dragState = signal<DragState>({
    isDragging: false,
    appointment: null,
    originalStartTime: "",
    originalEndTime: "",
    originalDoctorId: 0,
    newStartTime: "",
    newEndTime: "",
    newDoctorId: 0,
    startX: 0,
    startY: 0,
    slotHeight: 30,
    currentX: 0,
    currentY: 0,
    isValidTarget: false,
  });

  public readonly drag = this.dragState.asReadonly();

  // Working hours configuration (can be made configurable)
  private readonly workingHours = {
    start: 8, // 8 AM
    end: 18, // 6 PM
  };

  // Holidays configuration (can be loaded from API)
  private readonly holidays: string[] = [
    "2025-12-25", // Christmas
    "2025-01-01", // New Year
    "2025-07-04", // Independence Day
    // Add more holidays as needed
  ];

  /**
   * Start drag operation
   */
  startDrag(
    appointment: Appointment,
    startX: number,
    startY: number,
    slotHeight: number = 30
  ): void {
    const duration = this.calculateDuration(
      appointment.startTime,
      appointment.endTime
    );

    this.dragState.set({
      isDragging: true,
      appointment,
      originalStartTime: appointment.startTime,
      originalEndTime: appointment.endTime,
      originalDoctorId: appointment.doctorId,
      newStartTime: appointment.startTime,
      newEndTime: appointment.endTime,
      newDoctorId: appointment.doctorId,
      startX,
      startY,
      slotHeight,
      currentX: startX,
      currentY: startY,
      isValidTarget: true,
    });
  }

  /**
   * Update drag position and calculate new time/doctor
   */
  updateDrag(
    currentX: number,
    currentY: number,
    gridContainer: HTMLElement,
    doctors?: Doctor[],
    weekDays?: Date[]
  ): {
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
  } {
    const state = this.dragState();
    if (!state.appointment) {
      return {
        newStartTime: state.newStartTime,
        newEndTime: state.newEndTime,
        newDoctorId: state.newDoctorId,
        isValidTarget: false,
      };
    }

    const deltaY = currentY - state.startY;
    const deltaX = currentX - state.startX;

    // Calculate new start time based on vertical movement (snap to 30-min slots)
    const slotsMovedY = Math.round(deltaY / state.slotHeight);
    const originalStart = new Date(state.originalStartTime);

    // Start with time change based on vertical movement
    let newStartTime = new Date(
      originalStart.getTime() + slotsMovedY * 30 * 60 * 1000
    );

    // Check if we're in week view (has weekDays array)
    let newDoctorId = state.originalDoctorId;
    if (weekDays && weekDays.length === 7) {
      // Week view - handle cross-day dragging
      const containerRect = gridContainer.getBoundingClientRect();

      // Find the grid structure - we need to account for the time column
      // Grid has 8 columns: 1 time column + 7 day columns
      const timeColumnWidth = containerRect.width / 8; // Time column is 1/8 of total width
      const dayColumnsWidth = containerRect.width - timeColumnWidth; // Remaining 7/8 for days
      const dayColumnWidth = dayColumnsWidth / 7; // Each day column width

      // Calculate which day column we're over
      const relativeX = currentX - containerRect.left;
      const dayAreaX = relativeX - timeColumnWidth; // Subtract time column width
      const dayIndex = Math.floor(dayAreaX / dayColumnWidth);

      // Ensure we're within valid day bounds
      if (dayIndex >= 0 && dayIndex < 7) {
        const targetDay = weekDays[dayIndex];
        const originalStart = new Date(state.originalStartTime);

        // Debug logging
        console.log("Cross-day drag detected:", {
          dayIndex,
          targetDay: targetDay.toDateString(),
          originalDate: originalStart.toDateString(),
          timeAdjustedStartTime: newStartTime.toISOString(),
        });

        // Get the date components without time
        const originalDate = new Date(
          originalStart.getFullYear(),
          originalStart.getMonth(),
          originalStart.getDate()
        );
        const targetDate = new Date(
          targetDay.getFullYear(),
          targetDay.getMonth(),
          targetDay.getDate()
        );

        // Calculate the day difference in milliseconds
        const dayDifference = targetDate.getTime() - originalDate.getTime();

        // Apply day difference to the time-adjusted start time
        newStartTime = new Date(newStartTime.getTime() + dayDifference);

        console.log("Final new start time:", newStartTime.toISOString());
      }
    } else if (doctors && doctors.length > 1) {
      // Day view - calculate new doctor based on horizontal movement
      const containerRect = gridContainer.getBoundingClientRect();
      const doctorColumnWidth = containerRect.width / doctors.length;
      const relativeX = currentX - containerRect.left;
      const doctorIndex = Math.floor(relativeX / doctorColumnWidth);

      if (doctorIndex >= 0 && doctorIndex < doctors.length) {
        newDoctorId = doctors[doctorIndex].id;
      }
    }

    // Calculate new end time maintaining duration
    const duration = this.calculateDuration(
      state.originalStartTime,
      state.originalEndTime
    );
    const newEndTime = new Date(newStartTime.getTime() + duration * 60 * 1000);

    // Validate the new position
    const isValidTarget = this.validateDragTarget(
      newStartTime.toISOString(),
      newEndTime.toISOString(),
      newDoctorId
    ).isValid;

    // Update state
    this.dragState.update((current) => ({
      ...current,
      newStartTime: newStartTime.toISOString(),
      newEndTime: newEndTime.toISOString(),
      newDoctorId,
      currentX,
      currentY,
      isValidTarget,
    }));

    return {
      newStartTime: newStartTime.toISOString(),
      newEndTime: newEndTime.toISOString(),
      newDoctorId,
      isValidTarget,
    };
  }

  /**
   * Validate drag target
   */
  private validateDragTarget(
    newStartTime: string,
    newEndTime: string,
    newDoctorId: number
  ): DragValidationResult {
    const startTime = new Date(newStartTime);
    const endTime = new Date(newEndTime);
    const now = new Date();

    // Check if start time is in the past (only check date, not time)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    const appointmentDate = new Date(startTime);
    appointmentDate.setHours(0, 0, 0, 0); // Reset to start of day

    if (appointmentDate < today) {
      return {
        isValid: false,
        errorMessage: "Cannot schedule appointment in the past",
      };
    }

    // Check if end time is after start time
    if (endTime <= startTime) {
      return {
        isValid: false,
        errorMessage: "End time must be after start time",
      };
    }

    // Check if within working hours
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    if (
      startHour < this.workingHours.start ||
      endHour > this.workingHours.end ||
      (endHour === this.workingHours.end && endMinutes > 0)
    ) {
      return {
        isValid: false,
        errorMessage: `Appointment must be within clinic hours (${this.workingHours.start} AM - ${this.workingHours.end} PM)`,
      };
    }

    // Check if it's a weekend
    const dayOfWeek = startTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isValid: false,
        errorMessage: "Cannot schedule appointments on weekends",
      };
    }

    // Check if it's a holiday
    const dateStr = startTime.toISOString().split("T")[0];
    if (this.holidays.includes(dateStr)) {
      return {
        isValid: false,
        errorMessage: "Cannot schedule appointments on holidays",
      };
    }

    return { isValid: true };
  }

  /**
   * Validate final drag position including doctor availability
   */
  validateDragComplete(): Observable<DragValidationResult> {
    const state = this.dragState();
    if (!state.appointment) {
      return of({ isValid: false, errorMessage: "No appointment selected" });
    }

    // First check basic validation
    const basicValidation = this.validateDragTarget(
      state.newStartTime,
      state.newEndTime,
      state.newDoctorId
    );

    if (!basicValidation.isValid) {
      return of(basicValidation);
    }

    // TODO: Call API to check doctor availability
    // For now, simulate API call
    return new Observable<DragValidationResult>((observer) => {
      setTimeout(() => {
        // Simulate doctor availability check
        const isAvailable = Math.random() > 0.1; // 90% chance doctor is available

        if (isAvailable) {
          observer.next({ isValid: true });
        } else {
          observer.next({
            isValid: false,
            errorMessage: "Doctor is not available during the selected slot.",
          });
        }
        observer.complete();
      }, 300); // Simulate network delay
    });
  }

  /**
   * Get drag confirmation data
   */
  getDragConfirmation(): DragDropConfirmation | null {
    const state = this.dragState();
    if (!state.appointment) return null;

    const timeChanged =
      state.originalStartTime !== state.newStartTime ||
      state.originalEndTime !== state.newEndTime;
    const doctorChanged = state.originalDoctorId !== state.newDoctorId;

    return {
      appointment: state.appointment,
      newStartTime: state.newStartTime,
      newEndTime: state.newEndTime,
      newDoctorId: state.newDoctorId,
      changes: {
        timeChanged,
        doctorChanged,
      },
    };
  }

  /**
   * Complete drag operation
   */
  completeDrag(): Observable<Appointment> {
    const state = this.dragState();
    if (!state.appointment) {
      throw new Error("No appointment being dragged");
    }

    const updatedAppointment = {
      startTime: state.newStartTime,
      endTime: state.newEndTime,
      doctorId: state.newDoctorId,
    };

    return this.appointmentService.updateAppointment(
      state.appointment.id,
      updatedAppointment
    );
  }

  /**
   * Cancel drag operation
   */
  cancelDrag(): void {
    this.dragState.set({
      isDragging: false,
      appointment: null,
      originalStartTime: "",
      originalEndTime: "",
      originalDoctorId: 0,
      newStartTime: "",
      newEndTime: "",
      newDoctorId: 0,
      startX: 0,
      startY: 0,
      slotHeight: 30,
      currentX: 0,
      currentY: 0,
      isValidTarget: false,
    });
  }

  /**
   * Check if a time slot is blocked (past, weekend, holiday, outside working hours)
   */
  isTimeSlotBlocked(date: Date, timeSlot: string): boolean {
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hour, minute, 0, 0);

    // Check if in the past (only for today's slots that have already passed)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    // Only block past time slots if it's today
    if (slotDate.getTime() === today.getTime() && slotDateTime < now)
      return true;

    // Block dates before today
    if (slotDate < today) return true;

    // Check if weekend
    if (date.getDay() === 0 || date.getDay() === 6) return true;

    // Check if holiday
    const dateStr = date.toISOString().split("T")[0];
    if (this.holidays.includes(dateStr)) return true;

    // Check if outside working hours
    if (hour < this.workingHours.start || hour >= this.workingHours.end)
      return true;

    return false;
  }

  /**
   * Calculate duration in minutes
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }
}
