import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Appointment } from "../../../../shared/models/appointment.model";

@Component({
  selector: "app-appointment-popover",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./appointment-popover.component.html",
  styleUrl: "./appointment-popover.component.scss",
})
export class AppointmentPopoverComponent {
  public appointment = input.required<Appointment>();
  public isOpen = input<boolean>(false);
  public position = input<{ x: number; y: number }>({ x: 0, y: 0 });

  public edit = output<void>();
  public delete = output<void>();
  public close = output<void>();

  isPointingUp(): boolean {
    // Check if popover is positioned above the clicked element
    // This would be true when we had to flip the popover to avoid bottom overflow
    const popoverY = this.position().y;
    const viewportHeight = window.innerHeight;
    const popoverHeight = 350; // approximate

    // If the popover would extend beyond the bottom of the viewport,
    // it was likely positioned above the element (pointing down)
    return popoverY + popoverHeight > viewportHeight - 50;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatDateRange(): string {
    const startDate = new Date(this.appointment().startTime);
    const endDate = new Date(this.appointment().endTime);

    // Format the date part
    const dateStr = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Format the time range
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateStr}, ${startTime} - ${endTime}`;
  }

  getPatientName(): string {
    return (
      this.appointment().patient?.name ||
      `Patient ID: ${this.appointment().patientId}`
    );
  }

  getDoctorName(): string {
    return (
      this.appointment().doctor?.name ||
      `Doctor ID: ${this.appointment().doctorId}`
    );
  }

  onEdit(): void {
    this.edit.emit();
    this.close.emit();
  }

  onDelete(): void {
    this.delete.emit();
    this.close.emit();
  }
}
