import { Component, input, output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { AppointmentCardComponent } from "../appointment-card/appointment-card.component";
import { CalendarService } from "../../services/calendar.service";

@Component({
  selector: "app-month-view",
  standalone: true,
  imports: [CommonModule, AppointmentCardComponent],
  templateUrl: "./month-view.component.html",
  styleUrl: "./month-view.component.scss",
})
export class MonthViewComponent {
  private calendarService = inject(CalendarService);

  public currentDate = input<Date>(new Date());
  public appointments = input<Appointment[]>([]);

  public appointmentSelect = output<Appointment>();
  public dateSelect = output<Date>();

  get monthDays(): Date[] {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

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

  get weekDays(): string[] {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    const dateStr = this.calendarService.formatDateForFiltering(date);
    return this.appointments().filter((apt) =>
      apt.startTime.startsWith(dateStr)
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    const current = this.currentDate();
    return date.getMonth() === current.getMonth();
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  onDateClick(date: Date): void {
    this.dateSelect.emit(date);
  }

  onAppointmentClick(appointment: Appointment): void {
    this.appointmentSelect.emit(appointment);
  }
}
