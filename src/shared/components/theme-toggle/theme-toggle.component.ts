import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html'
})
export class ThemeToggleComponent {
  public themeService = inject(ThemeService);
  
  getThemeIcon(): string {
    switch (this.themeService.currentTheme()) {
      case 'light':
        return 'ri-sun-line';
      case 'dark':
        return 'ri-moon-line';
      case 'system':
        return 'ri-computer-line';
      default:
        return 'ri-computer-line';
    }
  }
}
