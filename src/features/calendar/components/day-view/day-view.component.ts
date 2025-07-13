import { Component, input, output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { AppointmentCardComponent } from "../appointment-card/appointment-card.component";
import { CalendarService } from "../../services/calendar.service";

@Component({
  selector: "app-day-view",
  standalone: true,
  imports: [CommonModule, AppointmentCardComponent],
  templateUrl: "./day-view.component.html",
  styleUrl: "./day-view.component.scss",
})
export class DayViewComponent {
  private calendarService = inject(CalendarService);

  public currentDate = input<Date>(new Date());
  public appointments = input<Appointment[]>([]);

  public appointmentSelect = output<Appointment>();
  public timeSlotSelect = output<{ date: Date; time: string }>();

  get timeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }

  get dayAppointments(): Appointment[] {
    const dateStr = this.calendarService.formatDateForFiltering(
      this.currentDate()
    );
    return this.appointments().filter((apt) =>
      apt.startTime.startsWith(dateStr)
    );
  }

  getAppointmentsForTimeSlot(timeSlot: string): Appointment[] {
    const date = this.currentDate();
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.dayAppointments.filter((apt) => {
      const aptStart = new Date(apt.startTime);
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      // Only show appointment at its starting time slot
      return aptStart.getHours() === hour && aptStart.getMinutes() === minute;
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

  isTimeSlotOccupied(timeSlot: string): boolean {
    const date = this.currentDate();
    const [hour, minute] = timeSlot.split(":").map(Number);

    return this.dayAppointments.some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      const slotTime = new Date(date);
      slotTime.setHours(hour, minute, 0, 0);

      return aptStart <= slotTime && aptEnd > slotTime;
    });
  }

  getAppointmentHeight(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Calculate exact number of 30-minute slots this appointment spans
    const slotsSpanned = durationMinutes / 30;

    // Each time slot has: py-3 (24px total padding) + min-h-[40px] + border-b (1px) = 65px
    const slotHeight = 65;

    // For appointments spanning multiple slots, we need the full height including borders
    const totalHeight = slotsSpanned * slotHeight;

    return Math.max(40, totalHeight);
  }

  getAppointmentTopOffset(appointment: Appointment, timeSlot: string): number {
    const aptStart = new Date(appointment.startTime);
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);

    // Calculate the minute offset within the time slot
    const aptMinute = aptStart.getMinutes();
    const slotStartMinute = slotMinute;

    // If appointment starts exactly at slot time, offset it up slightly to align with border
    if (aptMinute === slotStartMinute) {
      return -12; // Move up by 12px to align with slot border better
    }

    // Calculate offset based on minutes past the slot start
    const minuteOffset = aptMinute - slotStartMinute;
    // Each minute = slotHeight / 30 (since each slot is 30 minutes)
    const slotHeight = 65;
    const offsetPixels = (minuteOffset / 30) * slotHeight - 12; // Reduce top position by 12px

    return offsetPixels;
  }

  isPastTimeSlot(timeSlot: string): boolean {
    const now = new Date();
    const date = this.currentDate();
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotTime = new Date(date);
    slotTime.setHours(hour, minute, 0, 0);

    return slotTime < now;
  }

  onAppointmentClick(appointment: Appointment): void {
    this.appointmentSelect.emit(appointment);
  }

  onTimeSlotClick(timeSlot: string): void {
    // Don't allow clicking on past time slots
    if (this.isPastTimeSlot(timeSlot)) {
      return;
    }

    this.timeSlotSelect.emit({
      date: this.currentDate(),
      time: timeSlot,
    });
  }

  // Debug method to understand appointment duration and positioning
  debugAppointment(appointment: Appointment): void {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const height = this.getAppointmentHeight(appointment);
    const slotsSpanned = durationMinutes / 30;

    // Find the corresponding time slot
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const timeSlot = `${startHour.toString().padStart(2, "0")}:${startMinute
      .toString()
      .padStart(2, "0")}`;
    const topOffset = this.getAppointmentTopOffset(appointment, timeSlot);

    console.log("Appointment Debug:", {
      title: appointment.title,
      startTime: start.toLocaleString(),
      endTime: end.toLocaleString(),
      durationMinutes,
      slotsSpanned,
      calculatedHeight: height,
      topOffset: topOffset + "px (reduced by 12px for better alignment)",
      timeSlot,
      exactSlotAlignment:
        startMinute % 30 === 0
          ? "Aligned with 12px offset"
          : "Offset by " + (startMinute % 30) + " minutes + 12px adjustment",
      zIndex: "30 (lower than forms which use 50+)",
    });
  }
}
