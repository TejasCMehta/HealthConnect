import {
  Component,
  signal,
  inject,
  OnInit,
  ElementRef,
  ViewChild,
  HostBinding,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MonthViewComponent } from "./components/month-view/month-view.component";
import { WeekViewComponent } from "./components/week-view/week-view.component";
import { DayViewComponent } from "./components/day-view/day-view.component";
import { AppointmentFormComponent } from "./components/appointment-form/appointment-form.component";
import {
  AppointmentPopoverComponent,
  PopoverPosition,
} from "./components/appointment-popover/appointment-popover.component";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { CalendarService } from "./services/calendar.service";
import { AppointmentService } from "./services/appointment.service";
import { DoctorService } from "../doctors/services/doctor.service";
import { Appointment } from "../../shared/models/appointment.model";
import { Doctor } from "../../shared/models/doctor.model";
import { ToasterService } from "../../shared/services/toaster.service";

export type CalendarView = "month" | "week" | "day";

@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MonthViewComponent,
    WeekViewComponent,
    DayViewComponent,
    AppointmentFormComponent,
    AppointmentPopoverComponent,
    ConfirmationDialogComponent,
  ],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent implements OnInit, OnDestroy {
  private calendarService = inject(CalendarService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private toasterService = inject(ToasterService);
  private doctorService = inject(DoctorService);

  @ViewChild("calendarContainer", { read: ElementRef })
  calendarContainer!: ElementRef;

  @ViewChild(ConfirmationDialogComponent)
  confirmationDialog!: ConfirmationDialogComponent;

  @HostBinding("class.popover-open") get hasPopoverOpen() {
    return this.isPopoverOpen();
  }

  public currentView = signal<CalendarView>("month");
  public currentDate = signal(new Date());
  public appointments = signal<Appointment[]>([]);
  public doctors = signal<Doctor[]>([]);
  public isLoading = signal(true);
  public isFormOpen = signal(false);
  public selectedAppointment = signal<Appointment | null>(null);
  public selectedTimeSlot = signal<{ date: Date; time: string } | null>(null);

  // Popover state
  public isPopoverOpen = signal(false);
  public popoverAppointment = signal<Appointment | null>(null);
  public popoverPosition = signal<PopoverPosition>({ x: 0, y: 0 });

  // Doctor filter
  public selectedDoctorId = signal<string>("");

  // Scroll position preservation
  private scrollContainer: HTMLElement | null = null;
  private savedScrollPosition = 0;

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();

    // Initialize scroll container reference
    this.initializeScrollContainer();
  }

  ngOnDestroy(): void {
    // Clean up any event listeners if needed
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Error loading appointments:", error);
        this.isLoading.set(false);
      },
    });
  }

  private loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
      },
      error: (error) => {
        console.error("Error loading doctors:", error);
      },
    });
  }

  // New methods for redesigned calendar interface
  getSubheadingText(): string {
    const date = this.currentDate();
    const view = this.currentView();

    switch (view) {
      case "month":
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "week":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Week of ${startOfWeek.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}, ${startOfWeek.getFullYear()}`;
      case "day":
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      default:
        return "";
    }
  }

  getCurrentPeriodDisplay(): string {
    const date = this.currentDate();
    const view = this.currentView();

    switch (view) {
      case "month":
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "week":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const startMonth = startOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const endMonth = endOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return `${startMonth} - ${endMonth}, ${startOfWeek.getFullYear()}`;
      case "day":
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      default:
        return "";
    }
  }

  getPreviousPeriod(): Date {
    const date = new Date(this.currentDate());
    const view = this.currentView();

    switch (view) {
      case "month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "week":
        date.setDate(date.getDate() - 7);
        break;
      case "day":
        date.setDate(date.getDate() - 1);
        break;
    }
    return date;
  }

  getNextPeriod(): Date {
    const date = new Date(this.currentDate());
    const view = this.currentView();

    switch (view) {
      case "month":
        date.setMonth(date.getMonth() + 1);
        break;
      case "week":
        date.setDate(date.getDate() + 7);
        break;
      case "day":
        date.setDate(date.getDate() + 1);
        break;
    }
    return date;
  }

  onDoctorFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedDoctorId.set(select.value);
  }

  onTodayClick(): void {
    this.onDateChange(new Date());
  }

  onViewChange(view: CalendarView): void {
    this.currentView.set(view);
  }

  onDateChange(date: Date): void {
    this.currentDate.set(date);
  }

  onAppointmentSelect(appointment: Appointment): void {
    // In day view, open form directly. In month/week view, show popover
    if (this.currentView() === "day") {
      // Save scroll position when opening appointment form for editing
      this.saveScrollPosition();

      this.selectedAppointment.set(appointment);
      this.selectedTimeSlot.set(null);
      this.isFormOpen.set(true);
    } else {
      // Will be handled by onAppointmentClick for popover
    }
  }

  onAppointmentClick(event: {
    appointment: Appointment;
    clickEvent: MouseEvent;
  }): void {
    // Only show popover for month and week views
    if (this.currentView() === "month" || this.currentView() === "week") {
      this.showPopover(event.appointment, event.clickEvent);
    } else {
      // Day view - open form directly
      this.selectedAppointment.set(event.appointment);
      this.selectedTimeSlot.set(null);
      this.isFormOpen.set(true);
    }
  }

  private showPopover(appointment: Appointment, clickEvent: MouseEvent): void {
    // Use currentTarget to get the appointment element, not the clicked child element
    const targetElement = (clickEvent.currentTarget ||
      clickEvent.target) as HTMLElement;

    // Find the actual appointment card element if we clicked on a child
    let appointmentElement = targetElement;
    if (!appointmentElement.classList.contains("appointment-card")) {
      appointmentElement =
        targetElement.closest(".appointment-card") || targetElement;
    }

    const rect = appointmentElement.getBoundingClientRect();

    // Calculate initial position with better centering
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 12; // Increased gap for better visual separation

    // Viewport width and height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Popover dimensions (approximate)
    const popoverWidth = 320; // w-80 = 20rem = 320px
    const popoverHeight = 350; // approximate height with actions

    // Adjust horizontal position
    if (x + popoverWidth / 2 > viewportWidth - 16) {
      x = viewportWidth - popoverWidth - 16;
    } else if (x - popoverWidth / 2 < 16) {
      x = 16;
    } else {
      x = x - popoverWidth / 2;
    }

    // Determine placement based on available space
    let placement: "top" | "bottom" | "left" | "right" = "top"; // Default: popover below trigger, pointer points up

    // Adjust vertical position with better spacing
    if (y + popoverHeight > viewportHeight - 16) {
      // Position above the element with more gap
      y = rect.top - popoverHeight - 12;
      placement = "bottom"; // Popover above trigger, pointer points down

      // If still doesn't fit, check horizontal placement
      if (y < 16) {
        // Try positioning to the side
        if (rect.right + popoverWidth + 16 < viewportWidth) {
          x = rect.right + 16;
          y = Math.max(16, rect.top + rect.height / 2 - popoverHeight / 2);
          placement = "left"; // Popover to the right, pointer points left
        } else if (rect.left - popoverWidth - 16 > 0) {
          x = rect.left - popoverWidth - 16;
          y = Math.max(16, rect.top + rect.height / 2 - popoverHeight / 2);
          placement = "right"; // Popover to the left, pointer points right
        } else {
          y = 16; // Fallback to top of viewport
          placement = "bottom"; // Popover above trigger, pointer points down
        }
      }
    }

    // Add additional offset to bring popover closer based on placement
    if (placement === "bottom") {
      // Popover is above the appointment, bring it closer by moving down
      y = y + 10;
    } else if (placement === "right") {
      // Popover is to the left of the appointment, bring it closer by moving right
      x = x + 50;
    }

    // Ensure y is not negative
    if (y < 16) {
      y = 16;
    }

    // Ensure x is not negative
    if (x < 16) {
      x = 16;
    }

    this.popoverPosition.set({
      x,
      y,
      triggerRect: rect,
      placement,
    });
    this.popoverAppointment.set(appointment);
    this.isPopoverOpen.set(true);
  }

  onMoreAppointmentsClick(date: Date): void {
    // Navigate to day view for the selected date
    this.currentDate.set(date);
    this.currentView.set("day");
  }

  onPopoverEdit(): void {
    const appointment = this.popoverAppointment();
    if (appointment) {
      // Save scroll position when opening appointment form for editing from popover
      this.saveScrollPosition();

      this.selectedAppointment.set(appointment);
      this.selectedTimeSlot.set(null);
      this.isFormOpen.set(true);
      this.closePopover();
    }
  }

  onPopoverDelete(): void {
    const appointment = this.popoverAppointment();
    if (appointment) {
      // Show confirmation dialog
      this.confirmationDialog
        .open({
          title: "Delete Appointment",
          message: `Are you sure you want to delete the appointment "${appointment.title}"? This action cannot be undone.`,
          confirmText: "Delete",
          cancelText: "Cancel",
          confirmButtonClass: "bg-red-600 hover:bg-red-700",
        })
        .then((confirmed) => {
          if (confirmed) {
            this.appointmentService
              .deleteAppointment(appointment.id)
              .subscribe({
                next: () => {
                  this.loadAppointments();
                  this.closePopover();
                },
                error: (error) => {
                  console.error("Error deleting appointment:", error);
                },
              });
          }
        });
    }
  }

  closePopover(): void {
    this.isPopoverOpen.set(false);
    this.popoverAppointment.set(null);
  }

  isPopoverAppointmentPast(): boolean {
    const appointment = this.popoverAppointment();
    if (!appointment) {
      return false;
    }
    const now = new Date();
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate < now;
  }

  isSelectedAppointmentPast(): boolean {
    const appointment = this.selectedAppointment();
    if (!appointment) {
      return false;
    }
    const now = new Date();
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate < now;
  }

  onTimeSlotSelect(timeSlot: { date: Date; time: string }): void {
    // Save scroll position when opening appointment form
    this.saveScrollPosition();

    this.selectedAppointment.set(null);
    this.selectedTimeSlot.set(timeSlot);
    this.isFormOpen.set(true);
  }

  onNewAppointment(): void {
    // Save scroll position when opening appointment form
    this.saveScrollPosition();

    this.selectedAppointment.set(null);
    this.selectedTimeSlot.set(null);
    this.isFormOpen.set(true);
  }

  onFormClose(): void {
    this.isFormOpen.set(false);
    this.selectedAppointment.set(null);
    this.selectedTimeSlot.set(null);
  }

  onAppointmentSave(): void {
    this.loadAppointments();
    this.onFormClose();

    // Restore scroll position after appointment save with proper timing
    // Wait for loadAppointments() to complete and DOM to update
    setTimeout(() => {
      this.restoreScrollPosition();
    }, 200);
  }

  onAppointmentUpdate(updatedAppointment: Appointment): void {
    // Update the appointment in the local state
    this.appointments.update((appointments) =>
      appointments.map((apt) =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    );
  }

  /**
   * Initialize scroll container reference
   */
  private initializeScrollContainer(): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // Find the main content scroll container
      this.scrollContainer = document.getElementById("main-content");
      if (!this.scrollContainer) {
        // Fallback: look for any scrollable parent
        this.scrollContainer = document.querySelector(
          ".overflow-y-auto"
        ) as HTMLElement;
      }

      if (this.scrollContainer) {
        console.log(
          "Scroll container found:",
          this.scrollContainer.id || this.scrollContainer.className
        );
      } else {
        console.warn("No scroll container found");
      }
    }, 100);
  }

  /**
   * Save current scroll position
   */
  private saveScrollPosition(): void {
    console.log("=== SAVING SCROLL POSITION ===");

    // Get all possible scroll values
    const windowScrollY = window.scrollY || window.pageYOffset;
    const bodyScrollTop = document.body.scrollTop;
    const docScrollTop = document.documentElement.scrollTop;

    // Check main-content specifically
    const mainContent = document.getElementById("main-content");
    const mainContentScroll = mainContent ? mainContent.scrollTop : 0;

    // Check any element with overflow-y-auto
    const overflowElements = document.querySelectorAll(".overflow-y-auto");
    let maxOverflowScroll = 0;
    overflowElements.forEach((el, index) => {
      const elScroll = (el as HTMLElement).scrollTop;
      if (elScroll > maxOverflowScroll) {
        maxOverflowScroll = elScroll;
      }
      console.log(`Overflow element ${index}:`, elScroll, el.className);
    });

    // Check the calendar container itself
    const calendarContainer = this.calendarContainer?.nativeElement;
    const calendarScroll = calendarContainer ? calendarContainer.scrollTop : 0;

    // Check the parent elements of the calendar
    let parentScroll = 0;
    let currentEl = calendarContainer?.parentElement;
    let level = 0;
    while (currentEl && level < 5) {
      const scroll = currentEl.scrollTop;
      if (scroll > parentScroll) {
        parentScroll = scroll;
      }
      console.log(
        `Parent level ${level}:`,
        scroll,
        currentEl.tagName,
        currentEl.className
      );
      currentEl = currentEl.parentElement;
      level++;
    }

    console.log("All scroll positions detected:");
    console.log("- Window scrollY:", windowScrollY);
    console.log("- Body scrollTop:", bodyScrollTop);
    console.log("- Document scrollTop:", docScrollTop);
    console.log("- Main-content scrollTop:", mainContentScroll);
    console.log("- Max overflow element scroll:", maxOverflowScroll);
    console.log("- Calendar container scroll:", calendarScroll);
    console.log("- Max parent scroll:", parentScroll);

    // Use the highest scroll value found
    this.savedScrollPosition = Math.max(
      windowScrollY,
      bodyScrollTop,
      docScrollTop,
      mainContentScroll,
      maxOverflowScroll,
      calendarScroll,
      parentScroll
    );

    // Store reference to the container that has the scroll
    if (mainContentScroll > 0) {
      this.scrollContainer = mainContent;
    } else if (maxOverflowScroll > 0) {
      overflowElements.forEach((el) => {
        if ((el as HTMLElement).scrollTop === maxOverflowScroll) {
          this.scrollContainer = el as HTMLElement;
        }
      });
    } else if (calendarScroll > 0) {
      this.scrollContainer = calendarContainer;
    } else {
      this.scrollContainer = mainContent; // fallback to main-content
    }

    console.log("Final saved scroll position:", this.savedScrollPosition);
    console.log(
      "Using container:",
      this.scrollContainer?.id ||
        this.scrollContainer?.className ||
        this.scrollContainer?.tagName
    );
    console.log("=== END SAVE ===");
  }

  /**
   * Restore saved scroll position
   */
  private restoreScrollPosition(): void {
    if (this.savedScrollPosition <= 0) {
      console.log("No scroll position to restore (position was 0)");
      return;
    }

    console.log("=== RESTORING SCROLL POSITION ===");
    console.log("Target scroll position:", this.savedScrollPosition);

    // Focus on the most likely scroll containers
    const attempts = [
      {
        name: "main-content",
        element: document.getElementById("main-content"),
        action: (el: HTMLElement) => {
          el.scrollTop = this.savedScrollPosition;
        },
      },
      {
        name: "saved container",
        element: this.scrollContainer,
        action: (el: HTMLElement) => {
          el.scrollTop = this.savedScrollPosition;
        },
      },
      {
        name: "window",
        element: window as any,
        action: () => {
          window.scrollTo(0, this.savedScrollPosition);
        },
      },
      {
        name: "document.body",
        element: document.body,
        action: (el: HTMLElement) => {
          el.scrollTop = this.savedScrollPosition;
        },
      },
      {
        name: "document.documentElement",
        element: document.documentElement,
        action: (el: HTMLElement) => {
          el.scrollTop = this.savedScrollPosition;
        },
      },
    ];

    // Execute restoration attempts
    const executeAttempts = () => {
      attempts.forEach((attempt) => {
        if (attempt.element) {
          try {
            attempt.action(attempt.element as HTMLElement);
            console.log(
              `Attempted ${attempt.name} scroll to:`,
              this.savedScrollPosition
            );
          } catch (e) {
            console.warn(`Failed to scroll ${attempt.name}:`, e);
          }
        }
      });
    };

    // Try immediately
    executeAttempts();

    // Try with requestAnimationFrame
    requestAnimationFrame(() => {
      executeAttempts();

      // Try with setTimeout
      setTimeout(() => {
        executeAttempts();

        // Final verification
        setTimeout(() => {
          console.log("=== FINAL VERIFICATION ===");
          const mainContent = document.getElementById("main-content");
          if (mainContent) {
            console.log("Main-content final scroll:", mainContent.scrollTop);
            if (mainContent.scrollTop !== this.savedScrollPosition) {
              console.log(
                "Scroll not restored properly, trying one more time..."
              );
              mainContent.scrollTop = this.savedScrollPosition;
            }
          }
          console.log(
            "Window final scroll:",
            window.scrollY || window.pageYOffset
          );
          console.log("=== END RESTORE ===");
        }, 50);
      }, 100);
    });
  }
}
