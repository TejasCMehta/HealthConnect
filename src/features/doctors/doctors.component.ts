import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from './services/doctor.service';
import { DoctorFormComponent } from './components/doctor-form/doctor-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Doctor } from '../../shared/models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorFormComponent, ConfirmationDialogComponent],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss'
})
export class DoctorsComponent implements OnInit {
  private doctorService = inject(DoctorService);
  
  @ViewChild(ConfirmationDialogComponent) confirmationDialog!: ConfirmationDialogComponent;
  
  public doctors = signal<Doctor[]>([]);
  public isLoading = signal(true);
  public error = signal('');
  
  // Search and filtering
  public searchQuery = signal('');
  public specialtyFilter = signal('');
  public sortField = signal('name');
  public sortOrder = signal<'asc' | 'desc'>('asc');
  
  // Form
  public isFormOpen = signal(false);
  public selectedDoctor = signal<Doctor | null>(null);
  
  // Specialties for filter
  public specialties = signal<string[]>([]);
  
  ngOnInit(): void {
    this.loadDoctors();
  }
  
  private loadDoctors(): void {
    this.isLoading.set(true);
    this.error.set('');
    
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.extractSpecialties(doctors);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load doctors. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading doctors:', error);
      }
    });
  }
  
  private extractSpecialties(doctors: Doctor[]): void {
    const specialtySet = new Set(doctors.map(d => d.specialty));
    this.specialties.set(Array.from(specialtySet).sort());
  }
  
  // Search and filter
  onSearch(query: string): void {
    this.searchQuery.set(query);
  }
  
  onSpecialtyFilter(specialty: string): void {
    this.specialtyFilter.set(specialty);
  }
  
  onSort(field: string): void {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }
  
  get filteredDoctors(): Doctor[] {
    let filtered = this.doctors();
    
    // Search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.email.toLowerCase().includes(query)
      );
    }
    
    // Specialty filter
    if (this.specialtyFilter()) {
      filtered = filtered.filter(doctor => doctor.specialty === this.specialtyFilter());
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aVal = a[this.sortField() as keyof Doctor];
      const bVal = b[this.sortField() as keyof Doctor];
      
      if (this.sortOrder() === 'desc') {
        return aVal < bVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
    
    return filtered;
  }
  
  // CRUD operations
  onNewDoctor(): void {
    this.selectedDoctor.set(null);
    this.isFormOpen.set(true);
  }
  
  onEditDoctor(doctor: Doctor): void {
    this.selectedDoctor.set(doctor);
    this.isFormOpen.set(true);
  }
  
  async onDeleteDoctor(doctor: Doctor): Promise<void> {
    const confirmed = await this.confirmationDialog.open({
      title: 'Delete Doctor',
      message: `Are you sure you want to delete Dr. ${doctor.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700'
    });
    
    if (confirmed) {
      this.doctorService.deleteDoctor(doctor.id).subscribe({
        next: () => {
          this.loadDoctors();
        },
        error: (error) => {
          this.error.set('Failed to delete doctor. Please try again.');
          console.error('Error deleting doctor:', error);
        }
      });
    }
  }
  
  // Form handlers
  onFormClose(): void {
    this.isFormOpen.set(false);
    this.selectedDoctor.set(null);
  }
  
  onDoctorSave(): void {
    this.loadDoctors();
    this.onFormClose();
  }
  
  // Helper methods for templates
  getDoctorInitials(name: string): string {
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  }
}
