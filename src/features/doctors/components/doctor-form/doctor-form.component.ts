import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Doctor } from '../../../../shared/models/doctor.model';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-doctor-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.scss'
})
export class DoctorFormComponent implements OnInit {
  private doctorService = inject(DoctorService);
  
  public doctor = input<Doctor | null>(null);
  public close = output<void>();
  public save = output<void>();
  
  public isLoading = signal(false);
  public error = signal('');
  
  public form = signal({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    color: '#3b82f6'
  });
  
  // Common specialties
  public specialties = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Family Medicine',
    'Gastroenterology',
    'Internal Medicine',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Urology'
  ];
  
  // Color options
  public colorOptions = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280'  // Gray
  ];
  
  ngOnInit(): void {
    const doctor = this.doctor();
    if (doctor) {
      this.form.set({
        name: doctor.name,
        specialty: doctor.specialty,
        email: doctor.email,
        phone: doctor.phone,
        color: doctor.color
      });
    }
  }
  
  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading.set(true);
    this.error.set('');
    
    const formData = this.form();
    const operation = this.doctor() 
      ? this.doctorService.updateDoctor(this.doctor()!.id, formData)
      : this.doctorService.createDoctor(formData);
    
    operation.subscribe({
      next: () => {
        this.save.emit();
      },
      error: (error) => {
        this.error.set(error.message || 'An error occurred while saving the doctor');
        this.isLoading.set(false);
      }
    });
  }
  
  private validateForm(): boolean {
    const form = this.form();
    
    if (!form.name.trim()) {
      this.error.set('Name is required');
      return false;
    }
    
    if (!form.specialty.trim()) {
      this.error.set('Specialty is required');
      return false;
    }
    
    if (!form.email.trim()) {
      this.error.set('Email is required');
      return false;
    }
    
    if (!this.isValidEmail(form.email)) {
      this.error.set('Please enter a valid email address');
      return false;
    }
    
    if (!form.phone.trim()) {
      this.error.set('Phone number is required');
      return false;
    }
    
    return true;
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  updateForm(field: string, value: any): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }
  
  onCancel(): void {
    this.close.emit();
  }
  
  getDoctorInitials(): string {
    const name = this.form().name;
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }
  
  getPreviewName(): string {
    return this.form().name || 'Doctor Name';
  }
  
  getPreviewSpecialty(): string {
    return this.form().specialty || 'Specialty';
  }
  
  getButtonText(): string {
    return this.doctor() ? 'Update' : 'Create';
  }
}
