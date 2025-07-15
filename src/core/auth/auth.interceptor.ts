import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "./auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Add token to request if available
  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set("Authorization", `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        console.warn("401 Unauthorized - Token expired or invalid");

        // Clear invalid token and redirect to login
        authService.logout();

        // Optional: Show a user-friendly message
        console.log("Session expired. Please log in again.");

        // Don't throw the error for login page to avoid infinite loops
        if (!router.url.includes("/login")) {
          router.navigate(["/login"], {
            queryParams: { returnUrl: router.url, sessionExpired: "true" },
          });
        }
      }

      return throwError(() => error);
    })
  );
};
