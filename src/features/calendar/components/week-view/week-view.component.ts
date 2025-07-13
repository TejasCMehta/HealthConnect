import { Component, input, output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { AppointmentCardComponent } from "../appointment-card/appointment-card.component";
import { CalendarService } from "../../services/calendar.service";

@Component({
  selector: "app-week-view",
  standalone: true,
  imports: [CommonModule, AppointmentCardComponent],
  templateUrl: "./week-view.component.html",
  styleUrl: "./week-view.component.scss",
})
export class WeekViewComponent {
  private calendarService = inject(CalendarService);

  public currentDate = input<Date>(new Date());
  public appointments = input<Appointment[]>([]);

  public appointmentSelect = output<Appointment>();
  public appointmentClick = output<{
    appointment: Appointment;
    clickEvent: MouseEvent;
  }>();
  public timeSlotSelect = output<{ date: Date; time: string }>();

  get weekDays(): Date[] {
    const date = this.currentDate();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }

  get timeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }

  getAppointmentsForDateAndTime(date: Date, timeSlot: string): Appointment[] {
    const dateStr = this.calendarService.formatDateForFiltering(date);
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.appointments().filter((apt) => {
      const aptStart = new Date(apt.startTime);

      return (
        apt.startTime.startsWith(dateStr) &&
        aptStart.getHours() === hour &&
        aptStart.getMinutes() === minute
      );
    });
  }

  getOverlappingAppointments(
    appointments: Appointment[]
  ): { appointment: Appointment; column: number; totalColumns: number }[] {
    if (appointments.length <= 1) {
      return appointments.map((apt) => ({
        appointment: apt,
        column: 0,
        totalColumns: 1,
      }));
    }

    // Sort appointments by start time
    const sortedAppointments = [...appointments].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const result: {
      appointment: Appointment;
      column: number;
      totalColumns: number;
    }[] = [];

    // For overlapping appointments, assign columns
    sortedAppointments.forEach((apt, index) => {
      result.push({
        appointment: apt,
        column: index,
        totalColumns: sortedAppointments.length,
      });
    });

    return result;
  }

  isTimeSlotOccupied(date: Date, timeSlot: string): boolean {
    const dateStr = this.calendarService.formatDateForFiltering(date);
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.appointments().some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      return (
        apt.startTime.startsWith(dateStr) &&
        aptStart <= slotTime &&
        aptEnd > slotTime
      );
    });
  }

  getAppointmentHeight(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Calculate exact number of 30-minute slots this appointment spans
    const slotsSpanned = durationMinutes / 30;

    // Each 30-minute slot has a height of 60px in week view
    const slotHeight = 60;

    // For appointments spanning multiple slots, we need the full height
    const totalHeight = slotsSpanned * slotHeight;

    return Math.max(30, totalHeight);
  }

  getAppointmentTopOffset(appointment: Appointment, timeSlot: string): number {
    const aptStart = new Date(appointment.startTime);
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);

    // Calculate the minute offset within the time slot
    const aptMinute = aptStart.getMinutes();
    const slotStartMinute = slotMinute;

    // If appointment starts exactly at slot time, offset it up slightly to align with border
    if (aptMinute === slotStartMinute) {
      return -4; // Move up by 4px to align with slot border better (smaller offset for week view)
    }

    // Calculate offset based on minutes past the slot start
    const minuteOffset = aptMinute - slotStartMinute;
    // Each minute = slotHeight / 30 (since each slot is 30 minutes)
    const slotHeight = 60;
    const offsetPixels = (minuteOffset / 30) * slotHeight - 4; // Reduce top position by 4px

    return offsetPixels;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isPastTimeSlot(date: Date, timeSlot: string): boolean {
    const now = new Date();
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);

    return slotTime < now;
  }

  onAppointmentClick(appointment: Appointment, event: MouseEvent): void {
    event.stopPropagation();
    this.appointmentClick.emit({ appointment, clickEvent: event });
  }

  onTimeSlotClick(date: Date, timeSlot: string): void {
    // Don't allow clicking on past time slots
    if (this.isPastTimeSlot(date, timeSlot)) {
      return;
    }

    this.timeSlotSelect.emit({
      date: date,
      time: timeSlot,
    });
  }
}
