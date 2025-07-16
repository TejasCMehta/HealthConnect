import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  SettingsService,
  Settings,
  ClinicInfo,
  DayWorkingHours,
  AppointmentSettings,
  FilterSettings,
  Holiday,
} from "./services/settings.service";
import { ThemeService } from "../../core/services/theme.service";
import { AuthService } from "../../core/auth/auth.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  public themeService = inject(ThemeService);
  public authService = inject(AuthService);

  // Signals
  settings = signal<Settings>({
    clinic: {
      name: "HealthConnect Clinic",
      address: "123 Medical Center Dr",
      phone: "(555) 123-4567",
      email: "info@healthconnect.com",
      logo: "",
      website: "https://healthconnect.com",
    },
    workingHours: {
      default: { start: "09:00", end: "17:00" },
      monday: { start: "09:00", end: "17:00", enabled: true },
      tuesday: { start: "09:00", end: "17:00", enabled: true },
      wednesday: { start: "09:00", end: "17:00", enabled: true },
      thursday: { start: "09:00", end: "17:00", enabled: true },
      friday: { start: "09:00", end: "17:00", enabled: true },
      saturday: { start: "09:00", end: "13:00", enabled: true },
      sunday: { start: "10:00", end: "14:00", enabled: false },
    },
    holidays: ["2025-12-25", "2025-01-01"],
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    appointments: {
      allowOnHolidays: false,
      allowCancelledEdit: true,
      allowCancelledDelete: true,
      allowCompletedDelete: false,
      statusColors: {
        scheduled: "#3B82F6",
        confirmed: "#10B981",
        cancelled: "#EF4444",
        completed: "#059669",
        "no-show": "#9CA3AF",
      },
    },
    filters: {
      doctorFilter: true,
      statusFilter: true,
      dateRangeFilter: true,
    },
  });

  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  activeTab = signal("clinic");

  // Form models
  clinicForm: ClinicInfo = {
    name: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    website: "",
  };

  workingHoursForm: Record<string, DayWorkingHours> = {
    monday: { start: "09:00", end: "17:00", enabled: true },
    tuesday: { start: "09:00", end: "17:00", enabled: true },
    wednesday: { start: "09:00", end: "17:00", enabled: true },
    thursday: { start: "09:00", end: "17:00", enabled: true },
    friday: { start: "09:00", end: "17:00", enabled: true },
    saturday: { start: "09:00", end: "13:00", enabled: true },
    sunday: { start: "10:00", end: "14:00", enabled: false },
  };

  // Appointment settings form
  appointmentSettingsForm: AppointmentSettings = {
    allowOnHolidays: false,
    allowCancelledEdit: true,
    allowCancelledDelete: true,
    allowCompletedDelete: false,
    statusColors: {
      scheduled: "#3b82f6",
      confirmed: "#10b981",
      cancelled: "#ef4444",
      completed: "#6b7280",
      "no-show": "#f59e0b",
    },
  };

  filterSettingsForm: FilterSettings = {
    doctorFilter: true,
    statusFilter: true,
    dateRangeFilter: true,
    showAdvancedFilters: false,
  };

  // Holiday form fields
  newHoliday = {
    title: "",
    date: "",
    recurring: false,
  };
  showAddHolidayForm = false;

  // Date picker properties
  selectedYear = "";
  selectedMonth = "";
  selectedDay = "";
  availableYears: number[] = [];
  availableDays: number[] = [];
  months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Time picker options
  timeOptions = [
    "06:00",
    "06:30",
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
  ];

  // Settings tabs configuration
  settingsTabs = [
    { id: "clinic", label: "Clinic Info", icon: "ri-hospital-line" },
    { id: "hours", label: "Working Hours", icon: "ri-time-line" },
    { id: "holidays", label: "Holidays", icon: "ri-calendar-event-line" },
    {
      id: "appointments",
      label: "Appointments",
      icon: "ri-calendar-check-line",
    },
    { id: "theme", label: "Theme", icon: "ri-palette-line" },
  ];

  weekDays = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  appointmentStatuses = [
    { key: "scheduled" as const, label: "Scheduled" },
    { key: "confirmed" as const, label: "Confirmed" },
    { key: "cancelled" as const, label: "Cancelled" },
    { key: "completed" as const, label: "Completed" },
    { key: "no-show" as const, label: "No Show" },
  ];

  // Check if user is admin
  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === "admin";
  }

  ngOnInit() {
    this.initializeDatePicker();
    this.loadSettings();
  }

  private async loadSettings() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      this.settingsService.getSettings().subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.populateFormsFromSettings();
          this.isLoading.set(false);
        },
        error: (error) => {
          this.error.set("Failed to load settings");
          console.error("Error loading settings:", error);
          this.isLoading.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to load settings");
      console.error("Error loading settings:", error);
      this.isLoading.set(false);
    }
  }

  private populateFormsFromSettings() {
    const settings = this.settings();

    // Populate clinic form
    this.clinicForm = { ...settings.clinic };

    // Populate working hours form
    if (settings.workingHours) {
      this.workingHoursForm = {
        monday: settings.workingHours.monday,
        tuesday: settings.workingHours.tuesday,
        wednesday: settings.workingHours.wednesday,
        thursday: settings.workingHours.thursday,
        friday: settings.workingHours.friday,
        saturday: settings.workingHours.saturday,
        sunday: settings.workingHours.sunday,
      };
    }

    // Populate appointment settings
    if (settings.appointments) {
      this.appointmentSettingsForm = { ...settings.appointments };
    }

    // Populate filter settings
    if (settings.filters) {
      this.filterSettingsForm = { ...settings.filters };
    }
  }

  // Clinic Info Methods
  async onClinicInfoSubmit() {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      // Update settings with new clinic info
      const updatedSettings = {
        ...this.settings(),
        clinic: this.clinicForm,
      };

      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.showSuccessMessage("Clinic information updated successfully");
          this.isSaving.set(false);
        },
        error: (error) => {
          this.error.set("Failed to update clinic information");
          console.error("Error updating clinic info:", error);
          this.isSaving.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to update clinic information");
      console.error("Error updating clinic info:", error);
      this.isSaving.set(false);
    }
  }

  // Working Hours Methods
  generateHourOptions(): string[] {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(timeStr);
      }
    }
    return options;
  }

  getEndTimeOptions(startTime: string): string[] {
    const allOptions = this.generateHourOptions();
    const startIndex = allOptions.indexOf(startTime);
    return startIndex >= 0 ? allOptions.slice(startIndex + 1) : allOptions;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  }

  toggleDayEnabled(day: string) {
    this.workingHoursForm[day].enabled = !this.workingHoursForm[day].enabled;
  }

  async onWorkingHoursSubmit() {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      const updatedSettings = {
        ...this.settings(),
        workingHours: {
          ...this.settings().workingHours,
          ...this.workingHoursForm,
        },
      };

      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.showSuccessMessage("Working hours updated successfully");
          this.isSaving.set(false);
        },
        error: (error) => {
          this.error.set("Failed to update working hours");
          console.error("Error updating working hours:", error);
          this.isSaving.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to update working hours");
      console.error("Error updating working hours:", error);
      this.isSaving.set(false);
    }
  }

  // Holiday Methods
  get sortedHolidays(): (string | Holiday)[] {
    return [...this.settings().holidays].sort((a, b) => {
      const dateA = typeof a === "string" ? a : a.date;
      const dateB = typeof b === "string" ? b : b.date;
      return dateA.localeCompare(dateB);
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async onAddHoliday() {
    if (!this.newHoliday.title || !this.newHoliday.date) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const currentHolidays = this.settings().holidays || [];
      const newHolidayObj = {
        id: Date.now(),
        title: this.newHoliday.title,
        date: this.newHoliday.date,
        recurring: this.newHoliday.recurring,
      };

      const holidayExists = currentHolidays.some((h: any) =>
        typeof h === "string"
          ? h === this.newHoliday.date
          : h.date === this.newHoliday.date
      );

      if (!holidayExists) {
        const updatedSettings = {
          ...this.settings(),
          holidays: [...currentHolidays, newHolidayObj],
        };

        this.settingsService.updateSettings(updatedSettings).subscribe({
          next: (settings) => {
            this.settings.set(settings);
            this.resetHolidayForm();
            this.showSuccessMessage("Holiday added successfully");
            this.isSaving.set(false);
          },
          error: (error) => {
            this.error.set("Failed to add holiday");
            console.error("Error adding holiday:", error);
            this.isSaving.set(false);
          },
        });
      } else {
        this.error.set("Holiday already exists");
        this.isSaving.set(false);
      }
    } catch (error) {
      this.error.set("Failed to add holiday");
      console.error("Error adding holiday:", error);
      this.isSaving.set(false);
    }
  }

  async onRemoveHoliday(holiday: string | Holiday) {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      const currentHolidays = this.settings().holidays.filter((h) => {
        if (typeof h === "string" && typeof holiday === "string") {
          return h !== holiday;
        } else if (typeof h === "object" && typeof holiday === "object") {
          return h.id !== holiday.id;
        } else if (typeof h === "string" && typeof holiday === "object") {
          return h !== holiday.date;
        } else if (typeof h === "object" && typeof holiday === "string") {
          return h.date !== holiday;
        }
        return true;
      });
      const updatedSettings = {
        ...this.settings(),
        holidays: currentHolidays,
      };

      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.showSuccessMessage("Holiday removed successfully");
          this.isSaving.set(false);
        },
        error: (error) => {
          this.error.set("Failed to remove holiday");
          console.error("Error removing holiday:", error);
          this.isSaving.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to remove holiday");
      console.error("Error removing holiday:", error);
      this.isSaving.set(false);
    }
  }

  // Appointment Settings Methods
  async onAppointmentSettingsSubmit() {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      const updatedSettings = {
        ...this.settings(),
        appointments: this.appointmentSettingsForm,
      };

      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.showSuccessMessage("Appointment settings updated successfully");
          this.isSaving.set(false);
        },
        error: (error) => {
          this.error.set("Failed to update appointment settings");
          console.error("Error updating appointment settings:", error);
          this.isSaving.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to update appointment settings");
      console.error("Error updating appointment settings:", error);
      this.isSaving.set(false);
    }
  }

  // Filter Settings Methods
  async onFilterSettingsSubmit() {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      const updatedSettings = {
        ...this.settings(),
        filters: this.filterSettingsForm,
      };

      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.showSuccessMessage("Filter settings updated successfully");
          this.isSaving.set(false);
        },
        error: (error) => {
          this.error.set("Failed to update filter settings");
          console.error("Error updating filter settings:", error);
          this.isSaving.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to update filter settings");
      console.error("Error updating filter settings:", error);
      this.isSaving.set(false);
    }
  }

  // Additional methods for improved UI
  saveAllSettings() {
    this.isSaving.set(true);
    this.error.set(null);

    try {
      const updatedSettings = {
        ...this.settings(),
        clinic: this.clinicForm,
        workingHours: {
          ...this.settings().workingHours,
          ...this.workingHoursForm,
        },
        appointments: this.appointmentSettingsForm,
        filters: this.filterSettingsForm,
      };

      this.settingsService.updateSettings(updatedSettings).subscribe({
        next: (settings) => {
          this.settings.set(settings);
          this.showSuccessMessage("All settings saved successfully");
          this.isSaving.set(false);
        },
        error: (error) => {
          this.error.set("Failed to save settings");
          console.error("Error saving settings:", error);
          this.isSaving.set(false);
        },
      });
    } catch (error) {
      this.error.set("Failed to save settings");
      console.error("Error saving settings:", error);
      this.isSaving.set(false);
    }
  }

  exportSettings() {
    try {
      const dataStr = JSON.stringify(this.settings(), null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `healthconnect-settings-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      this.showSuccessMessage("Settings exported successfully");
    } catch (error) {
      this.error.set("Failed to export settings");
      console.error("Error exporting settings:", error);
    }
  }

  saveAppointmentSettings(): void {
    if (this.appointmentSettingsForm) {
      this.isSaving.set(true);
      console.log("Saving appointment settings:", this.appointmentSettingsForm);

      // Simulate async save operation
      setTimeout(() => {
        // Here you would typically call a service to persist the settings
        // this.settingsService.saveAppointmentSettings(this.appointmentSettingsForm);

        this.isSaving.set(false);
        alert("Appointment settings saved successfully!");
      }, 1000);
    }
  }

  addHoliday() {
    this.onAddHoliday();
  }

  removeHoliday(holiday: string | Holiday) {
    this.onRemoveHoliday(holiday);
  }

  holidays() {
    return this.settings().holidays;
  }

  // Working days helper
  get workingDays() {
    return [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
  }

  getTabClasses(tabId: string): string {
    const baseClasses =
      "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150";

    if (this.activeTab() === tabId) {
      return `${baseClasses} border-blue-500 text-blue-600 dark:text-blue-400`;
    }

    return `${baseClasses} border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600`;
  }

  getThemeButtonClasses(theme: string): string {
    const currentTheme = this.themeService.currentTheme();
    const baseClasses =
      "flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all duration-200";

    if (currentTheme === theme) {
      return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300`;
    }

    return `${baseClasses} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20`;
  }

  isStringHoliday(holiday: string | Holiday): holiday is string {
    return typeof holiday === "string";
  }

  isHolidayObject(holiday: string | Holiday): holiday is Holiday {
    return typeof holiday === "object";
  }

  getHolidayDate(holiday: string | Holiday): string {
    return typeof holiday === "string" ? holiday : holiday.date;
  }

  getHolidayTitle(holiday: string | Holiday): string {
    return typeof holiday === "string" ? "Holiday" : holiday.title;
  }

  resetHolidayForm() {
    this.newHoliday = {
      title: "",
      date: "",
      recurring: false,
    };
    this.selectedYear = "";
    this.selectedMonth = "";
    this.selectedDay = "";
    this.showAddHolidayForm = false;
  }

  toggleAddHolidayForm() {
    this.showAddHolidayForm = !this.showAddHolidayForm;
    if (!this.showAddHolidayForm) {
      this.resetHolidayForm();
    }
  }

  validateDateFormat() {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (this.newHoliday.date && !dateRegex.test(this.newHoliday.date)) {
      // Try to parse and reformat if it's a valid date
      const date = new Date(this.newHoliday.date);
      if (!isNaN(date.getTime())) {
        this.newHoliday.date = date.toISOString().split("T")[0];
      } else {
        this.error.set("Please enter a valid date in YYYY-MM-DD format");
      }
    }
  }

  initializeDatePicker() {
    // Generate available years (current year - 1 to current year + 10)
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let year = currentYear - 1; year <= currentYear + 10; year++) {
      this.availableYears.push(year);
    }
    this.updateAvailableDays();
  }

  updateAvailableDays() {
    // Update available days based on selected month and year
    if (!this.selectedMonth || !this.selectedYear) {
      this.availableDays = Array.from({ length: 31 }, (_, i) => i + 1);
      return;
    }

    const year = parseInt(this.selectedYear);
    const month = parseInt(this.selectedMonth);
    const daysInMonth = new Date(year, month, 0).getDate();

    this.availableDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Reset selected day if it's invalid for the new month
    if (this.selectedDay && parseInt(this.selectedDay) > daysInMonth) {
      this.selectedDay = "";
    }
  }

  updateDateFromSelects() {
    this.updateAvailableDays();

    if (this.selectedYear && this.selectedMonth && this.selectedDay) {
      const paddedMonth = this.selectedMonth.padStart(2, "0");
      const paddedDay = this.selectedDay.padStart(2, "0");
      this.newHoliday.date = `${this.selectedYear}-${paddedMonth}-${paddedDay}`;
    } else {
      this.newHoliday.date = "";
    }
  }

  handleDateKeydown(event: KeyboardEvent) {
    // Allow backspace, delete, tab, escape, enter
    if (
      [8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true)
    ) {
      return;
    }

    // Only allow numbers and hyphens
    if (
      (event.keyCode < 48 || event.keyCode > 57) &&
      event.keyCode !== 189 &&
      event.keyCode !== 109
    ) {
      event.preventDefault();
    }
  }

  private showSuccessMessage(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
