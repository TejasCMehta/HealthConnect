import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  constructor(private themeService: ThemeService) {
    // Initialize theme on app start
    this.themeService.initializeTheme();
  }
}
