import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent {
  public isOpen = input<boolean>(false);
  public isCollapsed = input<boolean>(false);
  public closeSidebar = output<void>();

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
