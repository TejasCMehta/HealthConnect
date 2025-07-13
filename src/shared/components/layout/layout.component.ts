import { Component, signal, OnInit, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";
import { ToasterComponent } from "../toaster/toaster.component";

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    ToasterComponent,
  ],
  templateUrl: "./layout.component.html",
  styleUrl: "./layout.component.scss",
})
export class LayoutComponent implements OnInit {
  public isSidebarOpen = signal(false);
  public isSidebarCollapsed = signal(false);

  ngOnInit(): void {
    // Initialize based on screen size
    this.checkScreenSize();
  }

  @HostListener("window:resize", ["$event"])
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const isLargeScreen = window.innerWidth >= 1024;
    if (isLargeScreen) {
      // On large screens, close mobile sidebar but keep desktop sidebar visible
      this.isSidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  toggleSidebarCollapse(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }
}
