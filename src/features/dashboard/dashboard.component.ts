import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Appointment } from '../../shared/models/appointment.model';
import { Patient } from '../../shared/models/patient.model';
import { Doctor } from '../../shared/models/doctor.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  public authService = inject(AuthService);
  
  public stats = signal({
    totalAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    totalDoctors: 0
  });
  
  public recentAppointments = signal<Appointment[]>([]);
  public upcomingAppointments = signal<Appointment[]>([]);
  public isLoading = signal(true);
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  private loadDashboardData(): void {
    this.isLoading.set(true);
    
    // Load appointments
    this.apiService.get<Appointment[]>('/appointments').subscribe({
      next: (appointments) => {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(apt => 
          apt.startTime.startsWith(today)
        );
        
        this.stats.update(stats => ({
          ...stats,
          totalAppointments: appointments.length,
          todayAppointments: todayAppointments.length
        }));
        
        // Get recent appointments (last 5)
        const recent = appointments
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .slice(0, 5);
        this.recentAppointments.set(recent);
        
        // Get upcoming appointments
        const upcoming = appointments
          .filter(apt => new Date(apt.startTime) > new Date())
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5);
        this.upcomingAppointments.set(upcoming);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
      }
    });
    
    // Load patients count
    this.apiService.get<Patient[]>('/patients').subscribe({
      next: (patients) => {
        this.stats.update(stats => ({
          ...stats,
          totalPatients: patients.length
        }));
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      }
    });
    
    // Load doctors count (only for admin)
    if (this.authService.hasRole('admin')) {
      this.apiService.get<Doctor[]>('/doctors').subscribe({
        next: (doctors) => {
          this.stats.update(stats => ({
            ...stats,
            totalDoctors: doctors.length
          }));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.isLoading.set(false);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
