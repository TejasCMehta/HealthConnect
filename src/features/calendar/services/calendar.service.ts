import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class CalendarService {
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
   * Generate time slots for day/week view
   */
  generateTimeSlots(
    startHour: number = 8,
    endHour: number = 18,
    intervalMinutes: number = 30
  ): string[] {
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
   * Check if a date is a weekend
   */
  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Check if a date is a holiday
   */
  isHoliday(date: Date, holidays: string[]): boolean {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.includes(dateStr);
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
