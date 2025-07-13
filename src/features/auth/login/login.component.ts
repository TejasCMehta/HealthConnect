import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  public username = signal('');
  public password = signal('');
  public isLoading = signal(false);
  public error = signal('');
  
  ngOnInit() {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }
  
  onSubmit(): void {
    if (!this.username() || !this.password()) {
      this.error.set('Please enter both username and password');
      return;
    }
    
    this.isLoading.set(true);
    this.error.set('');
    
    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Login failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
