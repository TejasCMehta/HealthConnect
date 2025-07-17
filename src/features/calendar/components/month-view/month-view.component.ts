import {
  Component,
  input,
  output,
  inject,
  ViewChild,
  ElementRef,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";
import { Doctor } from "../../../../shared/models/doctor.model";
import { AppointmentCardComponent } from "../appointment-card/appointment-card.component";
import { CalendarService } from "../../services/calendar.service";
import {
  AppointmentDragDropService,
  DragDropConfirmation,
} from "../../services/appointment-drag-drop.service";
import { DragDropConfirmationComponent } from "../drag-drop-confirmation/drag-drop-confirmation.component";
import { ToasterService } from "../../../../shared/services/toaster.service";
import { DoctorService } from "../../../doctors/services/doctor.service";

@Component({
  selector: "app-month-view",
  standalone: true,
  imports: [
    CommonModule,
    AppointmentCardComponent,
    DragDropConfirmationComponent,
  ],
  templateUrl: "./month-view.component.html",
  styleUrl: "./month-view.component.scss",
})
export class MonthViewComponent {
  private calendarService = inject(CalendarService);
  private dragDropService = inject(AppointmentDragDropService);
  private doctorService = inject(DoctorService);
  private toasterService = inject(ToasterService);

  @ViewChild("monthGrid", { static: false })
  monthGrid!: ElementRef<HTMLElement>;

  public currentDate = input<Date>(new Date());
  public appointments = input<Appointment[]>([]);
  public doctors = input<Doctor[]>([]);
  public selectedDoctorId = input<string>("");

  public appointmentSelect = output<Appointment>();
  public appointmentClick = output<{
    appointment: Appointment;
    clickEvent: MouseEvent;
  }>();
  public moreAppointmentsClick = output<{
    date: Date;
    clickEvent: MouseEvent;
  }>();
  public dateSelect = output<Date>();
  public appointmentUpdate = output<Appointment>();

  // Drag and drop state
  public isDragActive = signal(false);
  public dragOverDay = signal<Date | null>(null);
  public showDragDropModal = signal(false);
  public dragDropConfirmation = signal<DragDropConfirmation | null>(null);
  public isDragDropLoading = signal(false);

  // Constants
  public readonly MAX_VISIBLE_APPOINTMENTS = 3;

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

  // Utility methods for date formatting and validation
  formatDateForId(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  }

  // Appointment filtering and display methods
  getVisibleAppointments(date: Date): Appointment[] {
    const appointments = this.getAppointmentsForDate(date);
    return appointments.slice(0, this.MAX_VISIBLE_APPOINTMENTS);
  }

  getHiddenAppointmentsCount(date: Date): number {
    const appointments = this.getAppointmentsForDate(date);
    return Math.max(0, appointments.length - this.MAX_VISIBLE_APPOINTMENTS);
  }

  isPastAppointment(appointment: Appointment): boolean {
    const now = new Date();
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate < now;
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

  isTodaysDayOfWeek(dayName: string): boolean {
    const today = new Date();
    const todayDayName = today
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    return dayName.toUpperCase() === todayDayName;
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

  isWeekend(date: Date): boolean {
    return this.calendarService.isWeekend(date);
  }

  isWorkingDay(date: Date): boolean {
    return this.calendarService.isWorkingDay(date);
  }

  isHoliday(date: Date): boolean {
    return this.calendarService.isHoliday(date);
  }

  getHolidayDetails(date: Date): { title: string; recurring: boolean } | null {
    return this.calendarService.getHolidayDetails(date);
  }

  isRestrictedDay(date: Date): boolean {
    return !this.isWorkingDay(date) || this.isHoliday(date);
  }

  isRestrictedForNewAppointments(date: Date): boolean {
    return (
      this.isPastDate(date) || !this.isWorkingDay(date) || this.isHoliday(date)
    );
  }

  onDateClick(date: Date): void {
    // Normalize the date to avoid timezone issues
    // Create a new date with the same year, month, and day in local timezone
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    this.dateSelect.emit(normalizedDate);
  }

  onAppointmentClick(appointment: Appointment, event: MouseEvent): void {
    event.stopPropagation();
    this.appointmentClick.emit({ appointment, clickEvent: event });
  }

  // Drag and Drop Methods

  /**
   * Handle drag start event from appointment card
   */
  onDragStart(event: {
    appointment: Appointment;
    startX: number;
    startY: number;
  }): void {
    console.log("Month view drag started:", event);
    this.dragDropService.startDrag(
      event.appointment,
      event.startX,
      event.startY,
      20, // Month view slot height - must match the slotHeight passed to appointment cards
      "month" // Specify view type
    );
  }

  /**
   * Handle drag update event from appointment card
   */
  onDragUpdate(event: {
    appointment: Appointment;
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
    isValidTarget: boolean;
  }): void {
    console.log("Month view drag update:", event);
    // The appointment card component handles the drag calculation internally
    // and passes the results to us
  }

  /**
   * Handle drag complete event from appointment card
   */
  onDragComplete(event: {
    appointment: Appointment;
    newStartTime: string;
    newEndTime: string;
    newDoctorId: number;
  }): void {
    console.log("Month view drag complete:", event);

    // Get confirmation data from the drag drop service
    const confirmationData = this.dragDropService.getDragConfirmation();
    if (confirmationData) {
      // If doctor changed, fetch the new doctor details
      if (confirmationData.changes.doctorChanged) {
        this.doctorService.getDoctor(confirmationData.newDoctorId).subscribe({
          next: (doctor) => {
            confirmationData.newDoctor = doctor;
            this.dragDropConfirmation.set(confirmationData);
            this.showDragDropModal.set(true);
          },
          error: (error) => {
            console.error("Failed to fetch doctor details:", error);
            this.toasterService.showError(
              "Error",
              "Failed to fetch doctor details. Please try again."
            );
            this.dragDropService.cancelDrag();
          },
        });
      } else {
        this.dragDropConfirmation.set(confirmationData);
        this.showDragDropModal.set(true);
      }
    }
  }

  /**
   * Confirm drag and drop operation
   */
  onDragDropConfirm(): void {
    this.isDragDropLoading.set(true);

    // First validate with doctor availability check
    this.dragDropService.validateDragComplete().subscribe({
      next: (validation) => {
        if (validation.isValid) {
          // Complete the drag operation
          this.dragDropService.completeDrag().subscribe({
            next: (updatedAppointment) => {
              this.appointmentUpdate.emit(updatedAppointment);
              const confirmationData = this.dragDropConfirmation();
              let message = "Appointment moved successfully.";

              if (
                confirmationData?.changes.timeChanged &&
                confirmationData?.changes.doctorChanged
              ) {
                message = "Appointment time and doctor updated successfully.";
              } else if (confirmationData?.changes.timeChanged) {
                message = "Appointment time updated successfully.";
              } else if (confirmationData?.changes.doctorChanged) {
                message = "Appointment doctor updated successfully.";
              }

              this.toasterService.showSuccess("Appointment Updated", message);
              this.closeDragDropModal();
            },
            error: (error) => {
              console.error("Failed to update appointment:", error);
              this.toasterService.showError(
                "Update Failed",
                "Failed to update appointment. Please try again."
              );
              this.closeDragDropModal();
            },
          });
        } else {
          this.toasterService.showError(
            "Invalid Position",
            validation.errorMessage ||
              "Cannot move appointment to this position."
          );
          this.closeDragDropModal();
        }
      },
      error: (error) => {
        console.error("Failed to validate appointment position:", error);
        this.toasterService.showError(
          "Validation Failed",
          "Failed to validate appointment position. Please try again."
        );
        this.closeDragDropModal();
      },
    });
  }

  /**
   * Cancel drag and drop operation
   */
  onDragDropCancel(): void {
    this.dragDropService.cancelDrag();
    this.closeDragDropModal();
  }

  /**
   * Close drag drop modal
   */
  private closeDragDropModal(): void {
    this.isDragDropLoading.set(false);
    this.showDragDropModal.set(false);
    this.dragDropConfirmation.set(null);
  }

  // Drag and drop methods
  isDragOverDay(date: Date): boolean {
    const dragOverDate = this.dragOverDay();
    return dragOverDate ? this.isSameDay(dragOverDate, date) : false;
  }

  // Helper method for date comparison
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  onMoreClick(date: Date, event: MouseEvent): void {
    event.stopPropagation();
    this.moreAppointmentsClick.emit({ date, clickEvent: event });
  }
}
