import { Injectable, signal } from "@angular/core";
import { Settings } from "../../settings/services/settings.service";

@Injectable({
  providedIn: "root",
})
export class CalendarService {
  // Settings signal for reactive updates
  private settingsSignal = signal<Settings | null>(null);
  public settings = this.settingsSignal.asReadonly();

  /**
   * Update settings from the main calendar component
   */
  updateSettings(settings: Settings): void {
    this.settingsSignal.set(settings);
  }

  // Calendar utility methods

  /**
   * Get the first day of the month
   */
  getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the last day of the month
   */
  getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Get the start of the week (Sunday)
   */
  getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  }

  /**
   * Get the end of the week (Saturday)
   */
  getWeekEnd(date: Date): Date {
    const end = this.getWeekStart(date);
    return new Date(end.setDate(end.getDate() + 6));
  }

  /**
   * Get all days in the month view (including previous/next month padding)
   */
  getMonthViewDays(date: Date): Date[] {
    const firstDay = this.getFirstDayOfMonth(date);
    const lastDay = this.getLastDayOfMonth(date);

    // Get starting date (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Get ending date (might be from next month)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Get week days for week view
   */
  getWeekDays(date: Date): Date[] {
    const startOfWeek = this.getWeekStart(date);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }

  /**
   * Generate time slots for day/week view based on settings working hours
   */
  generateTimeSlots(date?: Date, intervalMinutes: number = 30): string[] {
    const settings = this.settingsSignal();
    let startHour = 8;
    let endHour = 18;

    if (settings && date) {
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
        date.getDay()
      ] as keyof typeof settings.workingHours;

      // Skip 'default' key and handle specific day working hours
      if (dayName !== "default") {
        const dayWorkingHours = settings.workingHours[dayName] as any;

        if (dayWorkingHours && dayWorkingHours.enabled) {
          startHour = parseInt(dayWorkingHours.start.split(":")[0]);
          endHour = parseInt(dayWorkingHours.end.split(":")[0]);
        }
      }
    }

    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeSlot = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeSlot);
      }
    }

    return slots;
  }

  /**
   * Format date for appointment filtering (consistent YYYY-MM-DD format)
   * This ensures timezone-independent date comparisons
   */
  formatDateForFiltering(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if a date is today
   */
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is in the past
   */
  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Check if a date is a weekend based on settings
   */
  isWeekend(date: Date): boolean {
    const settings = this.settingsSignal();
    if (!settings) {
      // Default behavior - Sunday and Saturday are weekends
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }

    // Check working days from settings
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
      date.getDay()
    ] as keyof typeof settings.workingDays;
    return !settings.workingDays[dayName];
  }

  /**
   * Check if a date is a working day based on both workingDays and workingHours settings
   */
  isWorkingDay(date: Date): boolean {
    const settings = this.settingsSignal();
    if (!settings) return true;

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
      date.getDay()
    ] as keyof typeof settings.workingDays;

    // Check both workingDays AND workingHours enabled status
    const isWorkingDayEnabled = settings.workingDays[dayName];

    // Check working hours for this specific day
    const dayWorkingHours = (settings.workingHours as any)[dayName];
    const isWorkingHoursEnabled = dayWorkingHours && dayWorkingHours.enabled;

    // Day is working only if BOTH settings allow it
    return isWorkingDayEnabled && isWorkingHoursEnabled;
  }

  /**
   * Check if a date is a holiday based on settings
   */
  isHoliday(date: Date, holidays?: string[]): boolean {
    const settings = this.settingsSignal();
    const holidayList = holidays || (settings ? settings.holidays : []);

    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    return holidayList.some((holiday) => {
      if (typeof holiday === "string") {
        return holiday === dateStr;
      }
      // If holiday is an object with date property
      return (holiday as any).date === dateStr;
    });
  }

  /**
   * Check if a time slot is during lunch break
   */
  isLunchBreak(date: Date, timeSlot: string): boolean {
    const settings = this.settingsSignal();
    if (!settings) return false;

    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[date.getDay()];
    const dayWorkingHours = (settings.workingHours as any)[dayName];

    // Check if day is enabled
    if (!dayWorkingHours || !dayWorkingHours.enabled) {
      return false;
    }

    // Check global lunch break first
    const globalLunchBreak = (settings.workingHours as any).globalLunchBreak;
    if (globalLunchBreak?.enabled && globalLunchBreak.applyToAllDays) {
      // If day has override and override is enabled, use day-specific settings
      if (
        dayWorkingHours.lunchBreak?.overrideGlobal &&
        globalLunchBreak.allowExceptions
      ) {
        if (dayWorkingHours.lunchBreak?.enabled) {
          const lunchStart = dayWorkingHours.lunchBreak.start;
          const lunchEnd = dayWorkingHours.lunchBreak.end;
          return timeSlot >= lunchStart && timeSlot < lunchEnd;
        }
        return false;
      } else {
        // Use global lunch break settings
        const lunchStart = globalLunchBreak.start;
        const lunchEnd = globalLunchBreak.end;
        return timeSlot >= lunchStart && timeSlot < lunchEnd;
      }
    }

    // Fall back to day-specific lunch break if no global settings
    if (!dayWorkingHours.lunchBreak?.enabled) {
      return false;
    }

    const lunchStart = dayWorkingHours.lunchBreak.start;
    const lunchEnd = dayWorkingHours.lunchBreak.end;

    return timeSlot >= lunchStart && timeSlot < lunchEnd;
  }

  /**
   * Get holiday details for a specific date
   */
  getHolidayDetails(date: Date): { title: string; recurring: boolean } | null {
    const settings = this.settingsSignal();
    if (!settings) return null;

    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const holiday = settings.holidays.find((holiday) => {
      if (typeof holiday === "string") {
        return holiday === dateStr;
      }
      // If holiday is an object with date property
      return (holiday as any).date === dateStr;
    });

    if (holiday) {
      if (typeof holiday === "string") {
        return { title: "Holiday", recurring: false };
      }
      return {
        title: (holiday as any).title || "Holiday",
        recurring: (holiday as any).recurring || false,
      };
    }

    return null;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
  }

  /**
   * Format time for display
   */
  formatTime(date: Date, use24Hour: boolean = false): string {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !use24Hour,
    });
  }

  /**
   * Calculate duration between two dates in minutes
   */
  calculateDuration(startDate: Date, endDate: Date): number {
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  /**
   * Check if two appointments overlap
   */
  checkAppointmentOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Get appointments that overlap with a given time slot
   */
  getOverlappingAppointments(
    appointments: any[],
    date: Date,
    timeSlot: string
  ): any[] {
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-minute slots

    return appointments.filter((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      return this.checkAppointmentOverlap(slotStart, slotEnd, aptStart, aptEnd);
    });
  }
}
