import { Component, signal, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CalendarNavigationComponent } from "./components/calendar-navigation/calendar-navigation.component";
import { MonthViewComponent } from "./components/month-view/month-view.component";
import { WeekViewComponent } from "./components/week-view/week-view.component";
import { DayViewComponent } from "./components/day-view/day-view.component";
import { AppointmentFormComponent } from "./components/appointment-form/appointment-form.component";
import { CalendarService } from "./services/calendar.service";
import { AppointmentService } from "./services/appointment.service";
import { Appointment } from "../../shared/models/appointment.model";

export type CalendarView = "month" | "week" | "day";

@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [
    CommonModule,
    CalendarNavigationComponent,
    MonthViewComponent,
    WeekViewComponent,
    DayViewComponent,
    AppointmentFormComponent,
  ],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private appointmentService = inject(AppointmentService);

  public currentView = signal<CalendarView>("month");
  public currentDate = signal(new Date());
  public appointments = signal<Appointment[]>([]);
  public isLoading = signal(true);
  public isFormOpen = signal(false);
  public selectedAppointment = signal<Appointment | null>(null);
  public selectedTimeSlot = signal<{ date: Date; time: string } | null>(null);

  ngOnInit(): void {
    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Error loading appointments:", error);
        this.isLoading.set(false);
      },
    });
  }

  onViewChange(view: CalendarView): void {
    this.currentView.set(view);
  }

  onDateChange(date: Date): void {
    this.currentDate.set(date);
  }

  onAppointmentSelect(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.selectedTimeSlot.set(null);
    this.isFormOpen.set(true);
  }

  onTimeSlotSelect(timeSlot: { date: Date; time: string }): void {
    this.selectedAppointment.set(null);
    this.selectedTimeSlot.set(timeSlot);
    this.isFormOpen.set(true);
  }

  onNewAppointment(): void {
    this.selectedAppointment.set(null);
    this.selectedTimeSlot.set(null);
    this.isFormOpen.set(true);
  }

  onFormClose(): void {
    this.isFormOpen.set(false);
    this.selectedAppointment.set(null);
    this.selectedTimeSlot.set(null);
  }

  onAppointmentSave(): void {
    this.loadAppointments();
    this.onFormClose();
  }
}
