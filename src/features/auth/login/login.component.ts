import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  
  public username = signal('');
  public password = signal('');
  public isLoading = signal(false);
  public error = signal('');
  public sessionExpiredMessage = signal('');
  private returnUrl = signal('/dashboard');
  
  ngOnInit() {
    // Check for session expired parameter
    const sessionExpired = this.route.snapshot.queryParams['sessionExpired'];
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    
    if (sessionExpired === 'true') {
      this.sessionExpiredMessage.set('Your session has expired. Please log in again.');
    }
    
    if (returnUrl) {
      this.returnUrl.set(returnUrl);
    }
    
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl()]);
    }
  }
  
  onSubmit(): void {
    if (!this.username() || !this.password()) {
      this.error.set('Please enter both username and password');
      return;
    }
    
    this.isLoading.set(true);
    this.error.set('');
    this.sessionExpiredMessage.set(''); // Clear session expired message on new login attempt
    
    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl()]);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Login failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
