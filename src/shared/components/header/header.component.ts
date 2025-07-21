import { Component, input, output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ThemeToggleComponent } from "../theme-toggle/theme-toggle.component";
import { AuthService } from "../../../core/auth/auth.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  public isSidebarCollapsed = input<boolean>(false);
  public toggleSidebar = output<void>();
  public toggleSidebarCollapse = output<void>();

  public authService = inject(AuthService);
}
