import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = 'http://localhost:8000';
  private readonly TOKEN_KEY = 'auth_token';
  
  // Angular Signals for reactive state
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signal for current user
  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  
  constructor() {
    // Check for existing token on service initialization
    this.checkAuthState();
  }
  
  private checkAuthState(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      // Decode token to get user info (in production, validate token with backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user: User = {
          id: payload.id,
          username: payload.username,
          role: payload.role,
          name: payload.name || payload.username,
          email: payload.email || ''
        };
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }
  
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem(this.TOKEN_KEY, response.token);
            this.currentUser.set(response.user);
            this.isAuthenticated.set(true);
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }
  
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.role === role || user?.role === 'admin';
  }
}
