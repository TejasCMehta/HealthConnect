import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointment-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointment-card.component.html',
  styleUrl: './appointment-card.component.scss'
})
export class AppointmentCardComponent {
  public appointment = input.required<Appointment>();
  public compact = input<boolean>(false);
  
  get startTime(): string {
    const date = new Date(this.appointment().startTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }
  
  get endTime(): string {
    const date = new Date(this.appointment().endTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }
  
  get duration(): number {
    const start = new Date(this.appointment().startTime);
    const end = new Date(this.appointment().endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  }
  
  get statusColor(): string {
    switch (this.appointment().status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }
}
