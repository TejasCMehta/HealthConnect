import {
  Component,
  signal,
  inject,
  OnInit,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { CalendarNavigationComponent } from "./components/calendar-navigation/calendar-navigation.component";
import { MonthViewComponent } from "./components/month-view/month-view.component";
import { WeekViewComponent } from "./components/week-view/week-view.component";
import { DayViewComponent } from "./components/day-view/day-view.component";
import { AppointmentFormComponent } from "./components/appointment-form/appointment-form.component";
import { AppointmentPopoverComponent } from "./components/appointment-popover/appointment-popover.component";
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
    AppointmentPopoverComponent,
  ],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent implements OnInit {
  private calendarService = inject(CalendarService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);

  @ViewChild("calendarContainer", { read: ElementRef })
  calendarContainer!: ElementRef;

  public currentView = signal<CalendarView>("month");
  public currentDate = signal(new Date());
  public appointments = signal<Appointment[]>([]);
  public isLoading = signal(true);
  public isFormOpen = signal(false);
  public selectedAppointment = signal<Appointment | null>(null);
  public selectedTimeSlot = signal<{ date: Date; time: string } | null>(null);

  // Popover state
  public isPopoverOpen = signal(false);
  public popoverAppointment = signal<Appointment | null>(null);
  public popoverPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

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
    // In day view, open form directly. In month/week view, show popover
    if (this.currentView() === "day") {
      this.selectedAppointment.set(appointment);
      this.selectedTimeSlot.set(null);
      this.isFormOpen.set(true);
    } else {
      // Will be handled by onAppointmentClick for popover
    }
  }

  onAppointmentClick(event: {
    appointment: Appointment;
    clickEvent: MouseEvent;
  }): void {
    // Only show popover for month and week views
    if (this.currentView() === "month" || this.currentView() === "week") {
      this.showPopover(event.appointment, event.clickEvent);
    } else {
      // Day view - open form directly
      this.selectedAppointment.set(event.appointment);
      this.selectedTimeSlot.set(null);
      this.isFormOpen.set(true);
    }
  }

  private showPopover(appointment: Appointment, clickEvent: MouseEvent): void {
    const rect = (clickEvent.target as HTMLElement).getBoundingClientRect();

    // Calculate initial position
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 8;

    // Viewport width and height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Popover dimensions (approximate)
    const popoverWidth = 320; // w-80 = 20rem = 320px
    const popoverHeight = 350; // approximate height with actions

    // Adjust horizontal position
    if (x + popoverWidth / 2 > viewportWidth - 16) {
      x = viewportWidth - popoverWidth - 16;
    } else if (x - popoverWidth / 2 < 16) {
      x = 16;
    } else {
      x = x - popoverWidth / 2;
    }

    // Adjust vertical position with better spacing
    if (y + popoverHeight > viewportHeight - 16) {
      // Position above the element
      y = rect.top - popoverHeight - 8;

      // If still doesn't fit, position at top with margin
      if (y < 16) {
        y = 16;
      }
    }

    // Ensure y is not negative
    if (y < 16) {
      y = 16;
    }

    this.popoverPosition.set({ x, y });
    this.popoverAppointment.set(appointment);
    this.isPopoverOpen.set(true);
  }

  onMoreAppointmentsClick(date: Date): void {
    // Navigate to day view for the selected date
    this.currentDate.set(date);
    this.currentView.set("day");
  }

  onPopoverEdit(): void {
    const appointment = this.popoverAppointment();
    if (appointment) {
      this.selectedAppointment.set(appointment);
      this.selectedTimeSlot.set(null);
      this.isFormOpen.set(true);
      this.closePopover();
    }
  }

  onPopoverDelete(): void {
    const appointment = this.popoverAppointment();
    if (appointment) {
      // Handle deletion - you might want to add a confirmation dialog
      this.appointmentService.deleteAppointment(appointment.id).subscribe({
        next: () => {
          this.loadAppointments();
          this.closePopover();
        },
        error: (error) => {
          console.error("Error deleting appointment:", error);
        },
      });
    }
  }

  closePopover(): void {
    this.isPopoverOpen.set(false);
    this.popoverAppointment.set(null);
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

  onAppointmentUpdate(updatedAppointment: Appointment): void {
    // Update the appointment in the local state
    this.appointments.update((appointments) =>
      appointments.map((apt) =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    );
  }
}
