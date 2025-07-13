import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'clinic-theme';
  
  // Angular Signal for reactive theme state
  public currentTheme = signal<Theme>('system');
  
  constructor() {
    this.initializeTheme();
  }
  
  initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    const theme = savedTheme || 'system';
    this.setTheme(theme);
  }
  
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }
  
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }
  
  toggleTheme(): void {
    const currentTheme = this.currentTheme();
    let newTheme: Theme;
    
    switch (currentTheme) {
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'system';
        break;
      case 'system':
        newTheme = 'light';
        break;
      default:
        newTheme = 'system';
    }
    
    this.setTheme(newTheme);
  }
}
