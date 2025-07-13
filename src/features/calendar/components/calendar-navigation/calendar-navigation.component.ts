import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarView } from '../../calendar.component';

@Component({
  selector: 'app-calendar-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-navigation.component.html',
  styleUrl: './calendar-navigation.component.scss'
})
export class CalendarNavigationComponent {
  public currentView = input<CalendarView>('month');
  public currentDate = input<Date>(new Date());
  
  public viewChange = output<CalendarView>();
  public dateChange = output<Date>();
  public newAppointment = output<void>();
  
  get formattedDate(): string {
    const date = this.currentDate();
    const view = this.currentView();
    
    switch (view) {
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = this.getWeekStart(date);
        const weekEnd = this.getWeekEnd(date);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      default:
        return '';
    }
  }
  
  private getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  }
  
  private getWeekEnd(date: Date): Date {
    const end = this.getWeekStart(date);
    return new Date(end.setDate(end.getDate() + 6));
  }
  
  onViewChange(view: CalendarView): void {
    this.viewChange.emit(view);
  }
  
  onPrevious(): void {
    const currentDate = this.currentDate();
    const view = this.currentView();
    let newDate: Date;
    
    switch (view) {
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        break;
      case 'week':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        break;
      default:
        newDate = currentDate;
    }
    
    this.dateChange.emit(newDate);
  }
  
  onNext(): void {
    const currentDate = this.currentDate();
    const view = this.currentView();
    let newDate: Date;
    
    switch (view) {
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      case 'week':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        break;
      default:
        newDate = currentDate;
    }
    
    this.dateChange.emit(newDate);
  }
  
  onToday(): void {
    this.dateChange.emit(new Date());
  }
}
