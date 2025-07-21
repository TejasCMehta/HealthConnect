import { Component, signal, inject, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public username = signal("");
  public password = signal("");
  public isLoading = signal(false);
  public error = signal("");
  public sessionExpiredMessage = signal("");
  private returnUrl = signal("/dashboard");

  // Carousel properties
  public carouselImages = signal([
    {
      src: "assets/1.png",
      title: "On resize confimration",
      description: "On resize event done, user can confirm the changes",
    },
    {
      src: "assets/2.png",
      title: "Clinic Settigns Management",
      description: "Advanced appointment scheduling system",
    },
    {
      src: "assets/3.png",
      title: "Lunch Break Settings",
      description: "Complete clinic working time management",
    },
    {
      src: "assets/4.png",
      title: "Holiday management",
      description: "Holiday management for clinic staff",
    },
    {
      src: "assets/5.png",
      title: "Drag & Drop Management",
      description: "User-friendly interface for managing appointments",
    },
    {
      src: "assets/6.png",
      title: "Appointment Drop validation on Restricted Time",
      description: "Drag & drop appointments with validation",
    },
  ]);
  public currentImageIndex = signal(0);
  private carouselInterval: any;

  ngOnInit() {
    // Check for session expired parameter
    const sessionExpired = this.route.snapshot.queryParams["sessionExpired"];
    const returnUrl = this.route.snapshot.queryParams["returnUrl"];

    if (sessionExpired === "true") {
      this.sessionExpiredMessage.set(
        "Your session has expired. Please log in again."
      );
    }

    if (returnUrl) {
      this.returnUrl.set(returnUrl);
    }

    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl()]);
    }

    // Start carousel auto-play
    this.startCarousel();
  }

  ngOnDestroy() {
    // Clean up the carousel interval
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  private startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextImage();
    }, 4000); // Change image every 4 seconds
  }

  public nextImage(): void {
    const images = this.carouselImages();
    this.currentImageIndex.set((this.currentImageIndex() + 1) % images.length);
  }

  public previousImage(): void {
    const images = this.carouselImages();
    const currentIndex = this.currentImageIndex();
    this.currentImageIndex.set(
      currentIndex === 0 ? images.length - 1 : currentIndex - 1
    );
  }

  public goToImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  public pauseCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  public resumeCarousel(): void {
    this.startCarousel();
  }

  onSubmit(): void {
    if (!this.username() || !this.password()) {
      this.error.set("Please enter both username and password");
      return;
    }

    this.isLoading.set(true);
    this.error.set("");
    this.sessionExpiredMessage.set(""); // Clear session expired message on new login attempt

    this.authService.login(this.username(), this.password()).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl()]);
      },
      error: (err) => {
        this.error.set(err.error?.error || "Login failed. Please try again.");
        this.isLoading.set(false);
      },
    });
  }
}
