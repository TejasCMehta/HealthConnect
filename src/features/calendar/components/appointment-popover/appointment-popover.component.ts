import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointment-popover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-popover.component.html',
  styleUrl: './appointment-popover.component.scss'
})
export class AppointmentPopoverComponent {
  public appointment = input.required<Appointment>();
  public isOpen = input<boolean>(false);
  public position = input<{ x: number; y: number }>({ x: 0, y: 0 });
  
  public edit = output<void>();
  public delete = output<void>();
  public close = output<void>();
  
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
