import { Component, signal, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  SettingsService,
  Settings,
  WorkingHours,
  WorkingDays,
} from "./services/settings.service";
import { ThemeService } from "../../core/services/theme.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  public themeService = inject(ThemeService);

  public settings = signal<Settings>({
    workingHours: { start: "08:00", end: "18:00" },
    holidays: [],
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
  });

  public isLoading = signal(true);
  public isSaving = signal(false);
  public error = signal("");
  public successMessage = signal("");

  // Form states
  public newHolidayDate = signal("");
  public workingHoursForm = signal<WorkingHours>({
    start: "08:00",
    end: "18:00",
  });
  public workingDaysForm = signal<WorkingDays>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  public availableEndTimes = signal<string[]>([]);

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.isLoading.set(true);
    this.error.set("");

    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.workingHoursForm.set(settings.workingHours);
        this.workingDaysForm.set(settings.workingDays);
        // Initialize end time options based on current start time
        this.generateEndTimeOptions(settings.workingHours.start);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set("Failed to load settings. Please try again.");
        this.isLoading.set(false);
        console.error("Error loading settings:", error);
      },
    });
  }

  // Working Hours
  onWorkingHoursSubmit(): void {
    if (!this.validateWorkingHours()) {
      return;
    }

    this.isSaving.set(true);
    this.error.set("");

    const updatedSettings: Settings = {
      ...this.settings(),
      workingHours: this.workingHoursForm(),
    };

    this.settingsService.updateSettings(updatedSettings).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.successMessage.set("Working hours updated successfully");
        this.isSaving.set(false);
        this.clearMessages();
      },
      error: (error) => {
        this.error.set("Failed to update working hours. Please try again.");
        this.isSaving.set(false);
        console.error("Error updating working hours:", error);
      },
    });
  }

  private validateWorkingHours(): boolean {
    const { start, end } = this.workingHoursForm();

    if (!start || !end) {
      this.error.set("Please set both start and end times");
      return false;
    }

    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);

    if (startTime >= endTime) {
      this.error.set("End time must be after start time");
      return false;
    }

    return true;
  }

  updateWorkingHours(field: "start" | "end", value: string): void {
    this.workingHoursForm.update((current) => ({
      ...current,
      [field]: value,
    }));

    // Generate end time options when start time changes
    if (field === "start") {
      this.generateEndTimeOptions(value);
    }
  }

  private generateEndTimeOptions(startTime: string): void {
    if (!startTime) {
      this.availableEndTimes.set([]);
      return;
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;

    const endTimes: string[] = [];

    // Generate end times from 30 minutes after start time until 23:00
    for (
      let minutes = startTotalMinutes + 30;
      minutes <= 23 * 60;
      minutes += 30
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      endTimes.push(timeString);
    }

    this.availableEndTimes.set(endTimes);

    // Clear end time if it's now invalid
    const currentEndTime = this.workingHoursForm().end;
    if (currentEndTime && !endTimes.includes(currentEndTime)) {
      this.workingHoursForm.update((current) => ({
        ...current,
        end: endTimes[0] || "",
      }));
    }
  }

  // Working Days
  onWorkingDaysSubmit(): void {
    this.isSaving.set(true);
    this.error.set("");

    const updatedSettings: Settings = {
      ...this.settings(),
      workingDays: this.workingDaysForm(),
    };

    this.settingsService.updateSettings(updatedSettings).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.successMessage.set("Working days updated successfully");
        this.isSaving.set(false);
        this.clearMessages();
      },
      error: (error) => {
        this.error.set("Failed to update working days. Please try again.");
        this.isSaving.set(false);
        console.error("Error updating working days:", error);
      },
    });
  }

  toggleWorkingDay(day: keyof WorkingDays): void {
    this.workingDaysForm.update((current) => ({
      ...current,
      [day]: !current[day],
    }));
  }

  // Holidays
  onAddHoliday(): void {
    const date = this.newHolidayDate().trim();
    if (!date) {
      this.error.set("Please select a date");
      return;
    }

    const holidays = this.settings().holidays;
    if (holidays.includes(date)) {
      this.error.set("This date is already added as a holiday");
      return;
    }

    this.isSaving.set(true);
    this.error.set("");

    const updatedSettings: Settings = {
      ...this.settings(),
      holidays: [...holidays, date].sort(),
    };

    this.settingsService.updateSettings(updatedSettings).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.newHolidayDate.set("");
        this.successMessage.set("Holiday added successfully");
        this.isSaving.set(false);
        this.clearMessages();
      },
      error: (error) => {
        this.error.set("Failed to add holiday. Please try again.");
        this.isSaving.set(false);
        console.error("Error adding holiday:", error);
      },
    });
  }

  onRemoveHoliday(date: string): void {
    this.isSaving.set(true);
    this.error.set("");

    const updatedSettings: Settings = {
      ...this.settings(),
      holidays: this.settings().holidays.filter((h) => h !== date),
    };

    this.settingsService.updateSettings(updatedSettings).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.successMessage.set("Holiday removed successfully");
        this.isSaving.set(false);
        this.clearMessages();
      },
      error: (error) => {
        this.error.set("Failed to remove holiday. Please try again.");
        this.isSaving.set(false);
        console.error("Error removing holiday:", error);
      },
    });
  }

  private clearMessages(): void {
    setTimeout(() => {
      this.successMessage.set("");
      this.error.set("");
    }, 3000);
  }

  generateHourOptions(): string[] {
    const hours: string[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        hours.push(timeString);
      }
    }
    return hours;
  }

  // Utility methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  formatTime(timeString: string): string {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  get sortedHolidays(): string[] {
    return this.settings().holidays.sort();
  }
}
