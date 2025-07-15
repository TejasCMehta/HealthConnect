import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError, switchMap } from "rxjs";
import { AuthService } from "./auth.service";
import { ToasterService } from "../../shared/services/toaster.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toaster = inject(ToasterService);
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

        // Don't try to refresh token for auth endpoints to avoid infinite loops
        if (req.url.includes("/auth/")) {
          authService.logout();
          return throwError(() => error);
        }

        // Try to refresh token if refresh token is available
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          console.log("Attempting to refresh token...");

          return authService.refreshToken().pipe(
            switchMap(() => {
              // Token refreshed successfully, retry the original request
              console.log("Token refreshed successfully, retrying request");
              const newToken = authService.getToken();
              const retryReq = req.clone({
                headers: req.headers.set("Authorization", `Bearer ${newToken}`),
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              // Refresh failed, logout user
              console.error("Token refresh failed:", refreshError);
              authService.logout();

              // Show user-friendly message
              toaster.showWarning(
                "Session Expired",
                "Your session has expired. Please log in again."
              );

              if (!router.url.includes("/login")) {
                router.navigate(["/login"], {
                  queryParams: {
                    returnUrl: router.url,
                    sessionExpired: "true",
                  },
                });
              }

              return throwError(() => error);
            })
          );
        } else {
          // No refresh token available, logout immediately
          console.log("No refresh token available, logging out");
          authService.logout();

          // Show user-friendly message
          toaster.showWarning(
            "Session Expired",
            "Your session has expired. Please log in again."
          );

          if (!router.url.includes("/login")) {
            router.navigate(["/login"], {
              queryParams: { returnUrl: router.url, sessionExpired: "true" },
            });
          }
        }
      }

      return throwError(() => error);
    })
  );
};
