import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ThemeToggleComponent } from "../theme-toggle/theme-toggle.component";

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
}
