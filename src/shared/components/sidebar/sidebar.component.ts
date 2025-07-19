import {
  Component,
  input,
  output,
  inject,
  signal,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";
import { ApiService } from "../../../core/services/api.service";
import { filter } from "rxjs";

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  color: string;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent implements OnInit {
  public isOpen = input<boolean>(false);
  public isCollapsed = input<boolean>(false);
  public closeSidebar = output<void>();

  private router = inject(Router);
  private apiService = inject(ApiService);

  public currentRoute = signal("");
  public doctors = signal<Doctor[]>([]);
  public selectedDoctors = signal(new Set<number>());

  public menuItems: MenuItem[] = [
    { icon: "ri-dashboard-line", label: "Dashboard", route: "/dashboard" },
    { icon: "ri-calendar-line", label: "Calendar", route: "/calendar" },
    { icon: "ri-user-line", label: "Patients", route: "/patients" },
    {
      icon: "ri-user-star-line",
      label: "Doctors",
      route: "/doctors",
      roles: ["admin"],
    },
    {
      icon: "ri-settings-line",
      label: "Settings",
      route: "/settings",
      roles: ["admin"],
    },
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Track route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.urlAfterRedirects);
      });

    // Set initial route
    this.currentRoute.set(this.router.url);

    // Load doctors and initialize filters
    this.loadDoctors();
    this.initializeFilters();
  }

  private loadDoctors(): void {
    this.apiService.get<Doctor[]>("/doctors").subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        // Initially select all doctors
        const allDoctorIds = new Set(doctors.map((d) => d.id));
        this.selectedDoctors.set(allDoctorIds);
      },
      error: (error) => {
        console.error("Error loading doctors:", error);
      },
    });
  }

  private initializeFilters(): void {
    // No status filters to initialize
  }

  public showDoctorFilters(): boolean {
    return (
      this.currentRoute().includes("/calendar") &&
      this.authService.hasRole("admin")
    );
  }

  public isAllDoctorsSelected(): boolean {
    return this.selectedDoctors().size === this.doctors().length;
  }

  public getActiveFiltersCount(): number {
    const totalDoctors = this.doctors().length;
    const selectedCount = this.selectedDoctors().size;

    // If all doctors are selected, no filters are active
    if (selectedCount === totalDoctors) {
      return 0;
    }

    // Return the number of selected doctors as active filters
    return selectedCount;
  }

  public toggleAllDoctors(): void {
    if (this.isAllDoctorsSelected()) {
      this.selectedDoctors.set(new Set());
    } else {
      const allDoctorIds = new Set(this.doctors().map((d) => d.id));
      this.selectedDoctors.set(allDoctorIds);
    }
    this.emitFilterChange();
  }

  public toggleDoctorFilter(doctorId: number): void {
    const current = new Set(this.selectedDoctors());
    if (current.has(doctorId)) {
      current.delete(doctorId);
    } else {
      current.add(doctorId);
    }
    this.selectedDoctors.set(current);
    this.emitFilterChange();
  }

  public clearAllFilters(): void {
    const allDoctorIds = new Set(this.doctors().map((d) => d.id));
    this.selectedDoctors.set(allDoctorIds);
    this.emitFilterChange();
  }

  private emitFilterChange(): void {
    // You can emit filter changes to parent components or use a service
    // For now, we'll store in localStorage for calendar component to read
    const filters = {
      doctors: Array.from(this.selectedDoctors()),
    };
    localStorage.setItem("calendarFilters", JSON.stringify(filters));

    // Dispatch a custom event that the calendar component can listen to
    window.dispatchEvent(
      new CustomEvent("calendarFiltersChanged", { detail: filters })
    );
  }

  shouldShowMenuItem(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return item.roles.some((role) => this.authService.hasRole(role));
  }

  onMenuItemClick(): void {
    this.closeSidebar.emit();
  }
}
