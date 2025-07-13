import { Component, inject, input, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Appointment } from "../../../../shared/models/appointment.model";
import { AppointmentResizeService } from "../../services/appointment-resize.service";

@Component({
  selector: "app-resize-confirmation-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./resize-confirmation-modal.component.html",
  styleUrl: "./resize-confirmation-modal.component.scss",
})
export class ResizeConfirmationModalComponent {
  private resizeService = inject(AppointmentResizeService);

  public isOpen = input<boolean>(false);
  public appointment = input<Appointment | null>(null);
  public newEndTime = input<string>("");

  public confirm = output<void>();
  public cancel = output<void>();

  public editableEndTime = signal<string>("");

  ngOnInit() {
    if (this.newEndTime()) {
      this.editableEndTime.set(this.formatTimeForInput(this.newEndTime()));
    }
  }

  ngOnChanges() {
    if (this.newEndTime()) {
      this.editableEndTime.set(this.formatTimeForInput(this.newEndTime()));
    }
  }

  get originalStartTime(): string {
    if (!this.appointment()) return "";
    return this.resizeService.getFormattedTime(this.appointment()!.startTime);
  }

  get originalEndTime(): string {
    if (!this.appointment()) return "";
    return this.resizeService.getFormattedTime(this.appointment()!.endTime);
  }

  get newFormattedEndTime(): string {
    if (!this.newEndTime()) return "";
    return this.resizeService.getFormattedTime(this.newEndTime());
  }

  get originalDuration(): number {
    if (!this.appointment()) return 0;
    const apt = this.appointment()!;
    return this.resizeService.getAppointmentDuration(
      apt.startTime,
      apt.endTime
    );
  }

  get newDuration(): number {
    if (!this.appointment() || !this.newEndTime()) return 0;
    const apt = this.appointment()!;
    return this.resizeService.getAppointmentDuration(
      apt.startTime,
      this.newEndTime()
    );
  }

  onConfirm(): void {
    // Update the new end time from the editable input
    const inputDate = this.parseTimeInput(this.editableEndTime());
    if (inputDate) {
      // Update the resize service with the new time
      // This would typically involve updating the state and then confirming
    }
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  private formatTimeForInput(isoString: string): string {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  private parseTimeInput(timeStr: string): Date | null {
    if (!this.appointment() || !timeStr.match(/^\d{2}:\d{2}$/)) {
      return null;
    }

    const [hours, minutes] = timeStr.split(":").map(Number);
    const appointmentDate = new Date(this.appointment()!.startTime);
    const newDate = new Date(appointmentDate);
    newDate.setHours(hours, minutes, 0, 0);

    return newDate;
  }
}
