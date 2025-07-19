import { Injectable, inject, signal } from "@angular/core";
import { Observable, of } from "rxjs";
import { Appointment } from "../../../shared/models/appointment.model";
import { Doctor } from "../../../shared/models/doctor.model";
import { AppointmentService } from "./appointment.service";
import { CalendarService } from "./calendar.service";
import { ToasterService } from "../../../shared/services/toaster.service";
import {
  SettingsService,
  Settings,
} from "../../settings/services/settings.service";

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
  viewType?: "week" | "day" | "month";
  hoveredDate?: string; // For month view - the date being hovered over
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
  private calendarService = inject(CalendarService);
  private toasterService = inject(ToasterService);
  private settingsService = inject(SettingsService);

  // Settings signal for reactive updates
  private settingsSignal = signal<Settings | null>(null);

  constructor() {
    // Load settings on initialization
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.settingsSignal.set(settings);
      },
      error: (error) => {
        console.error("Error loading settings in drag-drop service:", error);
        this.settingsSignal.set(null);
      },
    });
  }

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

  /**
   * Start drag operation
   */
  startDrag(
    appointment: Appointment,
    startX: number,
    startY: number,
    slotHeight: number = 30,
    viewType: "week" | "day" | "month" = "day"
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
      viewType,
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
    weekDays?: Date[],
    monthDays?: Date[]
  ): {
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
    hoveredDate?: string;
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
    const originalStart = new Date(state.originalStartTime);
    let newStartTime: Date;
    let newDoctorId = state.originalDoctorId;
    let hoveredDate: string | undefined;

    // Handle different view types
    if (state.viewType === "month" && monthDays && monthDays.length > 0) {
      // Month view - preserve original time, only change date
      const containerRect = gridContainer.getBoundingClientRect();

      // Month grid has 7 columns for days of the week
      const dayColumnWidth = containerRect.width / 7;

      // Calculate which day column we're over (horizontally)
      const relativeX = currentX - containerRect.left;
      const dayIndex = Math.floor(relativeX / dayColumnWidth);

      // Calculate which week row we're over (vertically)
      const dayRowHeight =
        containerRect.height / Math.ceil(monthDays.length / 7);
      const relativeY = currentY - containerRect.top;
      const rowIndex = Math.floor(relativeY / dayRowHeight);

      // Calculate the final day index in the monthDays array
      const finalDayIndex = rowIndex * 7 + dayIndex;

      // Ensure we're within valid day bounds
      if (finalDayIndex >= 0 && finalDayIndex < monthDays.length) {
        const targetDay = monthDays[finalDayIndex];

        // Always set the new time to the target date for proper validation
        // Preserve the original time, only change the date
        newStartTime = new Date(targetDay);
        newStartTime.setHours(originalStart.getHours());
        newStartTime.setMinutes(originalStart.getMinutes());
        newStartTime.setSeconds(originalStart.getSeconds());
        newStartTime.setMilliseconds(originalStart.getMilliseconds());

        // Set hovered date for preview
        hoveredDate = targetDay.toISOString();
      } else {
        // Outside valid bounds, keep original time
        newStartTime = new Date(originalStart);
      }
    } else {
      // Week and Day views - allow time changes with vertical movement
      // Calculate precise time slot based on mouse position within the grid
      const containerRect = gridContainer.getBoundingClientRect();
      const relativeY = currentY - containerRect.top;

      // Get working hours for the current day
      const settings = this.settingsSignal();
      let startOfDayHour = 8;
      let endOfDayHour = 18;
      if (settings) {
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const dayName = dayNames[
          originalStart.getDay()
        ] as keyof typeof settings.workingHours;
        if (dayName !== "default") {
          const dayWorkingHours = settings.workingHours[dayName] as any;
          if (dayWorkingHours && dayWorkingHours.enabled) {
            startOfDayHour = parseInt(dayWorkingHours.start.split(":")[0]);
            endOfDayHour = parseInt(dayWorkingHours.end.split(":")[0]);
          }
        }
      }

      const minutesPerSlot = 30;
      const totalSlots =
        ((endOfDayHour - startOfDayHour) * 60) / minutesPerSlot;
      // Calculate which 30-minute slot we're in based on Y position
      let slotIndex = Math.floor(relativeY / state.slotHeight);
      // Clamp slotIndex to valid range
      slotIndex = Math.max(0, Math.min(slotIndex, totalSlots - 1));
      const totalMinutesFromStart = slotIndex * minutesPerSlot;

      // Create new time based on the calculated slot
      newStartTime = new Date(originalStart);
      newStartTime.setHours(
        startOfDayHour + Math.floor(totalMinutesFromStart / 60)
      );
      newStartTime.setMinutes(totalMinutesFromStart % 60);
      newStartTime.setSeconds(0);
      newStartTime.setMilliseconds(0);

      // Handle cross-day dragging in week view
      if (weekDays && weekDays.length === 7) {
        // Grid has 8 columns: 1 time column + 7 day columns
        const timeColumnWidth = containerRect.width / 8;
        const dayColumnsWidth = containerRect.width - timeColumnWidth;
        const dayColumnWidth = dayColumnsWidth / 7;

        // Calculate which day column we're over
        const relativeX = currentX - containerRect.left;
        const dayAreaX = relativeX - timeColumnWidth;
        const dayIndex = Math.floor(dayAreaX / dayColumnWidth);

        // Ensure we're within valid day bounds
        if (dayIndex >= 0 && dayIndex < 7) {
          const targetDay = weekDays[dayIndex];

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
      hoveredDate,
    }));

    return {
      newStartTime: newStartTime.toISOString(),
      newEndTime: newEndTime.toISOString(),
      newDoctorId,
      isValidTarget,
      hoveredDate,
    };
  }

  /**
   * Calculate duration in minutes between two time strings
   */
  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60);
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
    const endTime = new Date(newEndTime); // Check if start time is in the past (check both date and time)
    const now = new Date();

    // Add 5 minutes tolerance - allow moving appointments to current time slot even if a few minutes have passed
    const toleranceMinutes = 5;
    const toleranceMs = toleranceMinutes * 60 * 1000;
    const startTimeWithTolerance = new Date(startTime.getTime() + toleranceMs);

    if (startTimeWithTolerance < now) {
      return {
        isValid: false,
        errorMessage: "Cannot move appointment to past time",
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

    const settings = this.settingsSignal();
    if (settings) {
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayName = dayNames[
        startTime.getDay()
      ] as keyof typeof settings.workingHours;

      if (dayName !== "default") {
        const dayWorkingHours = settings.workingHours[dayName] as any;

        if (dayWorkingHours && dayWorkingHours.enabled) {
          const workingStart = parseInt(dayWorkingHours.start.split(":")[0]);
          const workingEnd = parseInt(dayWorkingHours.end.split(":")[0]);

          if (
            startHour < workingStart ||
            endHour > workingEnd ||
            (endHour === workingEnd && endMinutes > 0)
          ) {
            return {
              isValid: false,
              errorMessage: `Appointment must be within clinic hours (${dayWorkingHours.start} - ${dayWorkingHours.end})`,
            };
          }
        } else {
          return {
            isValid: false,
            errorMessage: "Clinic is closed on this day",
          };
        }
      }
    }

    // Check if appointment conflicts with lunch break
    const startTimeString = `${startTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`;
    const endTimeString = `${endTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

    // Check if start time is during lunch break
    if (this.calendarService.isLunchBreak(startTime, startTimeString)) {
      return {
        isValid: false,
        errorMessage: "Cannot schedule appointments during lunch break",
      };
    }

    // Check if end time is during lunch break (but allow ending exactly at lunch break start time)
    if (this.calendarService.isLunchBreak(endTime, endTimeString)) {
      // Check if this is exactly the lunch break start time
      const settings = this.settingsSignal();
      if (settings) {
        const globalLunchBreak = (settings.workingHours as any)
          .globalLunchBreak;
        if (globalLunchBreak?.enabled && globalLunchBreak.applyToAllDays) {
          const lunchStart = globalLunchBreak.start;
          // If ending exactly at lunch break start time, allow it
          if (endTimeString !== lunchStart) {
            return {
              isValid: false,
              errorMessage: "Cannot schedule appointments during lunch break",
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
          const dayName = dayNames[endTime.getDay()];
          const dayWorkingHours = (settings.workingHours as any)[dayName];
          if (dayWorkingHours?.lunchBreak?.enabled) {
            const lunchStart = dayWorkingHours.lunchBreak.start;
            if (endTimeString !== lunchStart) {
              return {
                isValid: false,
                errorMessage: "Cannot schedule appointments during lunch break",
              };
            }
          }
        }
      }
    }

    // Check if it's a working day based on settings
    if (settings) {
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayName = dayNames[
        startTime.getDay()
      ] as keyof typeof settings.workingDays;

      if (!settings.workingDays[dayName]) {
        return {
          isValid: false,
          errorMessage: "Cannot schedule appointments on non-working days",
        };
      }
    }

    // Check if it's a holiday
    const dateStr = startTime.toISOString().split("T")[0];
    if (settings && this.isHoliday(dateStr, settings.holidays)) {
      if (!settings.appointments.allowOnHolidays) {
        return {
          isValid: false,
          errorMessage: "Cannot schedule appointments on holidays",
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get drag confirmation data
   */
  getDragConfirmation(): DragDropConfirmation | null {
    const state = this.dragState();
    if (!state.appointment) return null;

    const timeChanged =
      state.newStartTime !== state.originalStartTime ||
      state.newEndTime !== state.originalEndTime;
    const doctorChanged = state.newDoctorId !== state.originalDoctorId;

    if (!timeChanged && !doctorChanged) return null;

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
      return of();
    }

    const updatedAppointment: Appointment = {
      ...state.appointment,
      startTime: state.newStartTime,
      endTime: state.newEndTime,
      doctorId: state.newDoctorId,
    };

    return this.appointmentService.updateAppointment(
      updatedAppointment.id,
      updatedAppointment
    );
  }

  /**
   * Cancel drag operation
   */
  cancelDrag(): void {
    this.dragState.update((current) => ({
      ...current,
      isDragging: false,
      newStartTime: current.originalStartTime,
      newEndTime: current.originalEndTime,
      newDoctorId: current.originalDoctorId,
      isValidTarget: false,
    }));
  }

  /**
   * Validate drag complete with doctor availability
   */
  validateDragComplete(): Observable<DragValidationResult> {
    const state = this.dragState();
    if (!state.appointment) {
      return of({
        isValid: false,
        errorMessage: "No appointment being dragged",
      });
    }

    // First run basic validation
    const basicValidation = this.validateDragTarget(
      state.newStartTime,
      state.newEndTime,
      state.newDoctorId
    );

    if (!basicValidation.isValid) {
      return of(basicValidation);
    }

    // TODO: Add doctor availability check here
    // For now, just return the basic validation
    return of(basicValidation);
  }

  /**
   * Check if a time slot is blocked for drag and drop
   */
  isTimeSlotBlocked(date: Date, timeSlot: string): boolean {
    // TODO: Implement time slot blocking logic
    return false;
  }

  /**
   * Get floating drag preview data
   */
  getFloatingDragData(mouseX: number, mouseY: number) {
    const state = this.dragState();
    if (!state.isDragging || !state.appointment) {
      return null;
    }

    return {
      appointment: state.appointment,
      newStartTime: state.newStartTime,
      newEndTime: state.newEndTime,
      newDate: state.hoveredDate,
      isValidTarget: state.isValidTarget,
      mouseX,
      mouseY,
      viewType: state.viewType || "day",
      errorMessage: state.isValidTarget
        ? undefined
        : this.getValidationError(
            state.newStartTime,
            state.newEndTime,
            state.newDoctorId
          ),
    };
  }

  /**
   * Check if a date is a weekend (Saturday or Sunday)
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Check if a date string is a holiday based on settings
   */
  private isHoliday(dateString: string, holidays: (string | any)[]): boolean {
    return holidays.some((holiday) => {
      if (typeof holiday === "string") {
        return holiday === dateString;
      }
      // If holiday is an object with date property
      return holiday.date === dateString;
    });
  }

  /**
   * Check if a date is a holiday (legacy method for backward compatibility)
   */
  private isHolidayDate(date: Date): boolean {
    const settings = this.settingsSignal();
    if (!settings) return false;

    const dateString = date.toISOString().split("T")[0];
    return this.isHoliday(dateString, settings.holidays);
  }

  /**
   * Check if a date is blocked (weekend or holiday)
   */
  private isDateBlocked(date: Date): boolean {
    return this.isWeekend(date) || this.isHolidayDate(date);
  }

  /**
   * Check if a date is in the past
   */
  private isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < today;
  }

  /**
   * Get detailed validation error for floating preview
   */
  getValidationError(
    newStartTime: string,
    newEndTime: string,
    newDoctorId: number
  ): string | null {
    const validation = this.validateDragTarget(
      newStartTime,
      newEndTime,
      newDoctorId
    );
    return validation.isValid
      ? null
      : validation.errorMessage || "Invalid position";
  }
}
