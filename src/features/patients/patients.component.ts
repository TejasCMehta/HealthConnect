import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from './services/patient.service';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Patient, PatientResponse } from '../../shared/models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, PatientFormComponent, ConfirmationDialogComponent],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent implements OnInit {
  private patientService = inject(PatientService);
  
  @ViewChild(ConfirmationDialogComponent) confirmationDialog!: ConfirmationDialogComponent;
  
  public patients = signal<Patient[]>([]);
  public isLoading = signal(true);
  public error = signal('');
  
  // View mode
  public viewMode = signal<'cards' | 'table'>('cards');
  
  // Pagination
  public currentPage = signal(1);
  public pageSize = signal(10);
  public totalPages = signal(0);
  public totalItems = signal(0);
  
  // Search and filtering
  public searchQuery = signal('');
  public sortField = signal('name');
  public sortOrder = signal<'asc' | 'desc'>('asc');
  
  // Selection
  public selectedPatients = signal<number[]>([]);
  public selectAll = signal(false);
  
  // Form
  public isFormOpen = signal(false);
  public selectedPatient = signal<Patient | null>(null);
  
  ngOnInit(): void {
    this.loadPatients();
  }
  
  private loadPatients(): void {
    this.isLoading.set(true);
    this.error.set('');
    
    const params = {
      _page: this.currentPage(),
      _limit: this.pageSize(),
      _sort: this.sortField(),
      _order: this.sortOrder(),
      q: this.searchQuery()
    };
    
    this.patientService.getPatients(params).subscribe({
      next: (response: PatientResponse) => {
        this.patients.set(response.data);
        this.totalPages.set(response.totalPages);
        this.totalItems.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load patients. Please try again.');
        this.isLoading.set(false);
        console.error('Error loading patients:', error);
      }
    });
  }
  
  // View mode controls
  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode.set(mode);
  }
  
  // Search and filter
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadPatients();
  }
  
  onSort(field: string): void {
    if (this.sortField() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
    this.loadPatients();
  }
  
  // Pagination
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPatients();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadPatients();
  }
  
  // Selection
  onSelectPatient(patientId: number): void {
    const selected = this.selectedPatients();
    if (selected.includes(patientId)) {
      this.selectedPatients.set(selected.filter(id => id !== patientId));
    } else {
      this.selectedPatients.set([...selected, patientId]);
    }
    this.updateSelectAll();
  }
  
  onSelectAll(): void {
    const selectAll = !this.selectAll();
    this.selectAll.set(selectAll);
    
    if (selectAll) {
      this.selectedPatients.set(this.patients().map(p => p.id));
    } else {
      this.selectedPatients.set([]);
    }
  }
  
  private updateSelectAll(): void {
    const selected = this.selectedPatients();
    const allPatients = this.patients().map(p => p.id);
    this.selectAll.set(selected.length === allPatients.length && allPatients.length > 0);
  }
  
  // CRUD operations
  onNewPatient(): void {
    this.selectedPatient.set(null);
    this.isFormOpen.set(true);
  }
  
  onEditPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.isFormOpen.set(true);
  }
  
  async onDeletePatient(patient: Patient): Promise<void> {
    const confirmed = await this.confirmationDialog.open({
      title: 'Delete Patient',
      message: `Are you sure you want to delete ${patient.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700'
    });
    
    if (confirmed) {
      this.patientService.deletePatient(patient.id).subscribe({
        next: () => {
          this.loadPatients();
          this.selectedPatients.set(this.selectedPatients().filter(id => id !== patient.id));
        },
        error: (error) => {
          this.error.set('Failed to delete patient. Please try again.');
          console.error('Error deleting patient:', error);
        }
      });
    }
  }
  
  async onDeleteSelected(): Promise<void> {
    const selectedIds = this.selectedPatients();
    if (selectedIds.length === 0) return;
    
    const confirmed = await this.confirmationDialog.open({
      title: 'Delete Selected Patients',
      message: `Are you sure you want to delete ${selectedIds.length} patient(s)? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700'
    });
    
    if (confirmed) {
      this.patientService.deleteMultiplePatients(selectedIds).subscribe({
        next: () => {
          this.loadPatients();
          this.selectedPatients.set([]);
          this.selectAll.set(false);
        },
        error: (error) => {
          this.error.set('Failed to delete selected patients. Please try again.');
          console.error('Error deleting patients:', error);
        }
      });
    }
  }
  
  // Form handlers
  onFormClose(): void {
    this.isFormOpen.set(false);
    this.selectedPatient.set(null);
  }
  
  onPatientSave(): void {
    this.loadPatients();
    this.onFormClose();
  }
  
  // Utility methods
  get paginationInfo(): string {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, this.totalItems());
    return `Showing ${start}-${end} of ${this.totalItems()} patients`;
  }
  
  get paginationPages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    
    // Show up to 5 pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
}
