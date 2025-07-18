import {
  Component,
  input,
  output,
  signal,
  inject,
  OnInit,
  ChangeDetectorRef,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Appointment } from "../../../../shared/models/appointment.model";
import { AppointmentService } from "../../services/appointment.service";
import { PatientService } from "../../../patients/services/patient.service";
import { DoctorService } from "../../../doctors/services/doctor.service";
import {
  SettingsService,
  WorkingHours,
  WorkingDays,
} from "../../../settings/services/settings.service";
import { ToasterService } from "../../../../shared/services/toaster.service";
import { FormValidationService } from "../../../../shared/services/form-validation.service";
import { FieldErrorComponent } from "../../../../shared/components/field-error/field-error.component";

@Component({
  selector: "app-appointment-form",
  standalone: true,
  imports: [CommonModule, FormsModule, FieldErrorComponent],
  templateUrl: "./appointment-form.component.html",
  styleUrl: "./appointment-form.component.scss",
})
export class AppointmentFormComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  private toasterService = inject(ToasterService);
  public validationService = inject(FormValidationService);

  public appointment = input<Appointment | null>(null);
  public selectedTimeSlot = input<{ date: Date; time: string } | null>(null);
  public close = output<void>();
  public save = output<void>();

  public isLoading = signal(false);
  public error = signal("");

  public form = signal({
    title: "",
    description: "",
    patientId: "0",
    doctorId: "0",
    appointmentDate: "",
    startTime: "",
    endTime: "",
    status: "scheduled" as "scheduled" | "completed" | "cancelled",
  });

  public patients = signal<any[]>([]);
  public doctors = signal<any[]>([]);
  public workingHours = signal<WorkingHours>({ start: "08:00", end: "18:00" });
  public workingDays = signal<WorkingDays>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  public availableTimeSlots = signal<string[]>([]);
  public availableEndTimeSlots = signal<string[]>([]);
  public existingAppointments = signal<any[]>([]);
  private patientsLoaded = signal(false);
  private doctorsLoaded = signal(false);
  private workingHoursLoaded = signal(false);
  private workingDaysLoaded = signal(false);

  // Computed property for end time binding
  public currentEndTime = computed(() => this.form().endTime);

  ngOnInit(): void {
    this.loadFormData();
  }

  private setFormFromAppointment(): void {
    const apt = this.appointment();
    const timeSlot = this.selectedTimeSlot();

    if (apt) {
      console.log("Setting form from appointment:", apt);
      // ...existing debugging code...
      console.log(
        "Patient ID from appointment:",
        apt.patientId,
        "Type:",
        typeof apt.patientId
      );
      console.log(
        "Doctor ID from appointment:",
        apt.doctorId,
        "Type:",
        typeof apt.doctorId
      );
      console.log(
        "Available patients:",
        this.patients().map((p) => ({
          id: p.id,
          name: p.name,
          type: typeof p.id,
        }))
      );
      console.log(
        "Available doctors:",
        this.doctors().map((d) => ({
          id: d.id,
          idAsString: d.id.toString(),
          name: d.name,
          type: typeof d.id,
        }))
      );

      const startDateTime = new Date(apt.startTime);
      const appointmentDate = startDateTime.toISOString().split("T")[0]; // YYYY-MM-DD format
      const startTime = startDateTime.toTimeString().slice(0, 5); // HH:MM format
      const endDateTime = new Date(apt.endTime);
      const endTime = endDateTime.toTimeString().slice(0, 5); // HH:MM format

      this.form.set({
        title: apt.title,
        description: apt.description || "",
        patientId: apt.patientId.toString(),
        doctorId: apt.doctorId.toString(),
        appointmentDate: appointmentDate,
        startTime: startTime,
        endTime: endTime,
        status: apt.status,
      });

      // Generate end time slots based on start time - now that form is set with endTime
      this.generateEndTimeSlots(startTime, endTime);

      console.log("Form after setting:", this.form());
      console.log(
        "Available end time slots after generation:",
        this.availableEndTimeSlots()
      );

      // Force change detection to ensure the DOM is updated with the new slots
      setTimeout(() => {
        console.log("After timeout - Form:", this.form().endTime);
        console.log("After timeout - Slots:", this.availableEndTimeSlots());
      }, 100);
      console.log("Checking if doctorId matches any doctor:");
      const currentDoctorId = this.form().doctorId;
      this.doctors().forEach((doctor) => {
        const doctorIdString = doctor.id.toString();
        console.log(
          `Doctor ${doctor.name}: id=${
            doctor.id
          }, toString()=${doctorIdString}, matches form=${
            currentDoctorId === doctorIdString
          }`
        );
      });
    } else if (timeSlot) {
      console.log("Setting form from time slot:", timeSlot);
      // Create appointment from selected time slot
      const appointmentDate = timeSlot.date.toISOString().split("T")[0]; // YYYY-MM-DD format
      const startTime = timeSlot.time; // Already in HH:MM format

      // Calculate end time (1 hour later)
      const [hour, minute] = timeSlot.time.split(":").map(Number);
      const endHour = hour + 1;
      const endTime = `${endHour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      this.form.set({
        title: "",
        description: "",
        patientId: "0",
        doctorId: "0",
        appointmentDate: appointmentDate,
        startTime: startTime,
        endTime: endTime,
        status: "scheduled",
      });

      // Generate end time slots based on start time
      this.generateEndTimeSlots(startTime);

      console.log("Form set from time slot:", this.form());
    }
  }

  private loadFormData(): void {
    console.log("Loading form data for appointment form...");

    // Load working hours
    this.settingsService.getWorkingHours().subscribe({
      next: (hours) => {
        console.log("Working hours loaded:", hours);
        this.workingHours.set(hours);
        this.workingHoursLoaded.set(true);
        this.checkIfDataLoadedAndSetForm();
      },
      error: (error) => {
        console.error("Error loading working hours:", error);
        // Use default working hours
        this.workingHours.set({ start: "08:00", end: "18:00" });
        this.workingHoursLoaded.set(true);
        this.checkIfDataLoadedAndSetForm();
      },
    });

    // Load all patients using the pagination service with high limit to get all
    this.patientService.getPatients({ _limit: 1000 }).subscribe({
      next: (response) => {
        console.log("Patients response:", response);
        // The response should have a 'data' property with the patients array
        const patients = response.data || [];
        console.log("Patients loaded:", patients);
        this.patients.set(patients);
        this.patientsLoaded.set(true);
        this.checkIfDataLoadedAndSetForm();
      },
      error: (error) => {
        console.error("Error loading patients:", error);
        this.error.set("Failed to load patients. Please try again.");
      },
    });

    // Load doctors
    this.doctorService.getDoctors().subscribe({
      next: (doctors) => {
        console.log("Doctors loaded:", doctors);
        this.doctors.set(doctors);
        this.doctorsLoaded.set(true);
        this.checkIfDataLoadedAndSetForm();
      },
      error: (error) => {
        console.error("Error loading doctors:", error);
        this.error.set("Failed to load doctors. Please try again.");
      },
    });

    // Load working days
    this.settingsService.getWorkingDays().subscribe({
      next: (workingDays) => {
        console.log("Working days loaded:", workingDays);
        this.workingDays.set(workingDays);
        this.workingDaysLoaded.set(true);
        this.generateTimeSlots();
        this.checkIfDataLoadedAndSetForm();
      },
      error: (error) => {
        console.error("Error loading working days:", error);
        // Use default working days
        this.workingDays.set({
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        });
        this.workingDaysLoaded.set(true);
        this.generateTimeSlots();
        this.checkIfDataLoadedAndSetForm();
      },
    });
  }

  private checkIfDataLoadedAndSetForm(): void {
    if (
      this.patientsLoaded() &&
      this.doctorsLoaded() &&
      this.workingHoursLoaded() &&
      this.workingDaysLoaded()
    ) {
      console.log(
        "All data loaded (patients, doctors, working hours, working days), setting form"
      );
      // Add a small delay to ensure DOM is updated
      setTimeout(() => {
        this.setFormFromAppointment();
      }, 0);
    }
  }

  private generateTimeSlots(): void {
    const workingHours = this.workingHours();
    const slots: string[] = [];

    const [startHour, startMinute] = workingHours.start.split(":").map(Number);
    const [endHour, endMinute] = workingHours.end.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Generate slots every 30 minutes
    for (
      let minutes = startTotalMinutes;
      minutes < endTotalMinutes;
      minutes += 30
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }

    this.availableTimeSlots.set(slots);
    console.log("Generated time slots:", slots);
  }

  private generateEndTimeSlots(
    startTime: string,
    existingEndTime?: string
  ): void {
    if (!startTime) {
      this.availableEndTimeSlots.set([]);
      return;
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;

    const workingHours = this.workingHours();
    const [endHour, endMinute] = workingHours.end.split(":").map(Number);
    const endTotalMinutes = endHour * 60 + endMinute;

    const slots: string[] = [];

    // Generate slots starting from 30 minutes after start time
    for (
      let minutes = startTotalMinutes + 30;
      minutes <= endTotalMinutes;
      minutes += 30
    ) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }

    // If we have an existing end time (editing appointment), ensure it's included
    const endTimeToInclude = existingEndTime || this.form().endTime;
    const isEditingAppointment = this.appointment() !== null;

    console.log("generateEndTimeSlots debug:", {
      startTime,
      existingEndTime,
      endTimeToInclude,
      isEditingAppointment,
      slotsBeforeAdding: [...slots],
    });

    if (
      isEditingAppointment &&
      endTimeToInclude &&
      !slots.includes(endTimeToInclude)
    ) {
      // Add the existing end time to the slots and sort them
      slots.push(endTimeToInclude);
      slots.sort((a, b) => {
        const [aHour, aMinute] = a.split(":").map(Number);
        const [bHour, bMinute] = b.split(":").map(Number);
        const aMinutes = aHour * 60 + aMinute;
        const bMinutes = bHour * 60 + bMinute;
        return aMinutes - bMinutes;
      });
      console.log(
        "Added existing appointment end time to slots:",
        endTimeToInclude
      );
    }

    this.availableEndTimeSlots.set(slots);
    console.log("Generated end time slots:", slots);

    // If we're editing an appointment, ensure the form's endTime is preserved
    if (isEditingAppointment && endTimeToInclude) {
      // Force the form to update again to ensure the endTime is properly bound
      setTimeout(() => {
        const currentForm = this.form();
        if (currentForm.endTime !== endTimeToInclude) {
          this.form.update((current) => ({
            ...current,
            endTime: endTimeToInclude,
          }));
          console.log("Force updated form endTime:", endTimeToInclude);
        }
        // Force change detection
        this.cdr.detectChanges();
        console.log("Forced change detection for end time binding");
      }, 0);
    }
  }

  private isWeekend(date: Date): boolean {
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayName = dayNames[date.getDay()] as keyof WorkingDays;
    const workingDays = this.workingDays();
    return !workingDays[dayName];
  }

  private isHoliday(date: Date): boolean {
    // This would check against the holidays from settings
    // For now, just return false
    return false;
  }

  private async checkAppointmentConflicts(
    patientId: string,
    doctorId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string
  ): Promise<string[]> {
    const errors: string[] = [];

    // Convert form data to datetime objects for comparison
    const startDateTime = new Date(`${appointmentDate}T${startTime}`);
    const endDateTime = new Date(`${appointmentDate}T${endTime}`);

    try {
      // Get existing appointments for the date
      const date = new Date(appointmentDate);
      const appointments = await this.appointmentService
        .getAppointmentsByDate(date)
        .toPromise();

      const existingAppointments = appointments || [];

      // Check for patient conflicts (no overlapping appointments for same patient)
      const patientConflicts = existingAppointments.filter(
        (apt: any) =>
          apt.patientId.toString() === patientId &&
          this.appointment()?.id !== apt.id // Exclude current appointment if editing
      );

      for (const conflict of patientConflicts) {
        const conflictStart = new Date(conflict.startTime);
        const conflictEnd = new Date(conflict.endTime);

        if (
          this.isTimeOverlapping(
            startDateTime,
            endDateTime,
            conflictStart,
            conflictEnd
          )
        ) {
          errors.push(
            `Patient already has an appointment from ${conflictStart.toLocaleTimeString()} to ${conflictEnd.toLocaleTimeString()}`
          );
        }
      }

      // Check for doctor conflicts (no overlapping appointments for same doctor)
      const doctorConflicts = existingAppointments.filter(
        (apt: any) =>
          apt.doctorId.toString() === doctorId &&
          this.appointment()?.id !== apt.id // Exclude current appointment if editing
      );

      for (const conflict of doctorConflicts) {
        const conflictStart = new Date(conflict.startTime);
        const conflictEnd = new Date(conflict.endTime);

        if (
          this.isTimeOverlapping(
            startDateTime,
            endDateTime,
            conflictStart,
            conflictEnd
          )
        ) {
          errors.push(
            `Doctor is already booked from ${conflictStart.toLocaleTimeString()} to ${conflictEnd.toLocaleTimeString()}`
          );
        }
      }
    } catch (error) {
      console.error("Error checking appointment conflicts:", error);
    }

    return errors;
  }

  private isTimeOverlapping(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  async onSubmit(): Promise<void> {
    // Clear previous validation errors
    this.validationService.clearAllErrors();

    if (!(await this.validateForm())) {
      return;
    }

    this.isLoading.set(true);
    this.error.set("");

    const formData = this.form();

    // Combine date and time to create ISO datetime strings
    const startDateTime = new Date(
      `${formData.appointmentDate}T${formData.startTime}`
    );
    const endDateTime = new Date(
      `${formData.appointmentDate}T${formData.endTime}`
    );

    const appointmentData = {
      title: formData.title,
      description: formData.description,
      patientId: parseInt(formData.patientId),
      doctorId: parseInt(formData.doctorId),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: formData.status,
    };

    const operation = this.appointment()
      ? this.appointmentService.updateAppointment(
          this.appointment()!.id,
          appointmentData
        )
      : this.appointmentService.createAppointment(appointmentData);

    operation.subscribe({
      next: () => {
        const isUpdate = !!this.appointment();
        this.toasterService.showSuccess(
          isUpdate ? "Appointment Updated" : "Appointment Created",
          isUpdate
            ? "The appointment has been successfully updated."
            : "The appointment has been successfully created."
        );
        this.save.emit();
      },
      error: (error) => {
        this.toasterService.showError(
          "Error",
          error.message || "An error occurred while saving the appointment"
        );
        this.isLoading.set(false);
      },
    });
  }

  private async validateForm(): Promise<boolean> {
    const form = this.form();
    let isValid = true;

    // Validate required fields
    if (!this.validationService.validateRequired(form.title.trim(), "title")) {
      isValid = false;
    }

    if (!this.validationService.validateSelection(form.patientId, "patient")) {
      isValid = false;
    }

    if (!this.validationService.validateSelection(form.doctorId, "doctor")) {
      isValid = false;
    }

    if (
      !this.validationService.validateRequired(
        form.appointmentDate,
        "appointmentDate"
      )
    ) {
      isValid = false;
    }

    if (!this.validationService.validateRequired(form.startTime, "startTime")) {
      isValid = false;
    }

    if (!this.validationService.validateRequired(form.endTime, "endTime")) {
      isValid = false;
    }

    // If basic validation fails, return early
    if (!isValid) {
      return false;
    }

    // Validate appointment date
    const appointmentDate = new Date(form.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      this.validationService.setFieldError(
        "appointmentDate",
        "Appointment date cannot be in the past"
      );
      isValid = false;
    }

    // Check if it's a weekend (if weekends are not allowed)
    if (this.isWeekend(appointmentDate)) {
      this.validationService.setFieldError(
        "appointmentDate",
        "Appointments cannot be scheduled on weekends"
      );
      isValid = false;
    }

    // Check if it's a holiday
    if (this.isHoliday(appointmentDate)) {
      this.validationService.setFieldError(
        "appointmentDate",
        "Appointments cannot be scheduled on holidays"
      );
      isValid = false;
    }

    // Validate time range
    const [startHour, startMinute] = form.startTime.split(":").map(Number);
    const [endHour, endMinute] = form.endTime.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      this.validationService.setFieldError(
        "endTime",
        "End time must be after start time"
      );
      isValid = false;
    }

    // Validate working hours
    const workingHours = this.workingHours();
    const [workStartHour, workStartMinute] = workingHours.start
      .split(":")
      .map(Number);
    const [workEndHour, workEndMinute] = workingHours.end
      .split(":")
      .map(Number);

    const workStartMinutes = workStartHour * 60 + workStartMinute;
    const workEndMinutes = workEndHour * 60 + workEndMinute;

    if (startTotalMinutes < workStartMinutes) {
      this.validationService.setFieldError(
        "startTime",
        `Start time must be after working hours start (${workingHours.start})`
      );
      isValid = false;
    }

    if (endTotalMinutes > workEndMinutes) {
      this.validationService.setFieldError(
        "endTime",
        `End time must be before working hours end (${workingHours.end})`
      );
      isValid = false;
    }

    // Check for appointment conflicts
    const conflicts = await this.checkAppointmentConflicts(
      form.patientId,
      form.doctorId,
      form.appointmentDate,
      form.startTime,
      form.endTime
    );

    if (conflicts.length > 0) {
      // Show doctor booking conflict in toaster instead of form
      this.toasterService.showError("Scheduling Conflict", conflicts[0]);
      isValid = false;
    }

    return isValid;
  }

  updateForm(field: string, value: any): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    // Clear validation error when user starts typing/selecting
    if (value) {
      this.validationService.clearFieldError(field);

      // Special mapping for field names
      if (field === "patientId") {
        this.validationService.clearFieldError("patient");
      } else if (field === "doctorId") {
        this.validationService.clearFieldError("doctor");
      }
    }

    // Auto-populate end time when start time is selected
    if (field === "startTime" && value) {
      this.generateEndTimeSlots(value);
      this.autoPopulateEndTime(value);
    }

    // Clear end time if start time is cleared
    if (field === "startTime" && !value) {
      this.availableEndTimeSlots.set([]);
      this.form.update((current) => ({
        ...current,
        endTime: "",
      }));
    }
  }

  private autoPopulateEndTime(startTime: string): void {
    const currentForm = this.form();
    const isEditingAppointment = this.appointment() !== null;

    if (isEditingAppointment && currentForm.endTime) {
      // When editing an appointment, calculate the original duration and maintain it
      const originalAppointment = this.appointment();
      if (originalAppointment) {
        const originalStart = new Date(originalAppointment.startTime);
        const originalEnd = new Date(originalAppointment.endTime);
        const originalDurationMinutes =
          (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60);

        // Calculate new end time based on new start time + original duration
        const [newStartHour, newStartMinute] = startTime.split(":").map(Number);
        const newStartTotalMinutes = newStartHour * 60 + newStartMinute;
        const newEndTotalMinutes =
          newStartTotalMinutes + originalDurationMinutes;

        const newEndHour = Math.floor(newEndTotalMinutes / 60);
        const newEndMinute = newEndTotalMinutes % 60;

        // Make sure the new end time doesn't exceed working hours
        const workingHours = this.workingHours();
        const [workEndHour] = workingHours.end.split(":").map(Number);

        if (
          newEndHour < workEndHour ||
          (newEndHour === workEndHour && newEndMinute === 0)
        ) {
          const newEndTimeString = `${newEndHour
            .toString()
            .padStart(2, "0")}:${newEndMinute.toString().padStart(2, "0")}`;

          this.form.update((current) => ({
            ...current,
            endTime: newEndTimeString,
          }));

          // Regenerate end time slots to include the new end time
          this.generateEndTimeSlots(startTime, newEndTimeString);

          console.log(
            `Maintained original duration of ${originalDurationMinutes} minutes. New end time:`,
            newEndTimeString
          );
          return;
        }
      }

      console.log(
        "Editing appointment with existing end time, preserving:",
        currentForm.endTime
      );
      return;
    }

    // For new appointments, default to 1 hour
    const [hour, minute] = startTime.split(":").map(Number);
    const endHour = hour + 1;

    // Make sure the end time doesn't exceed working hours
    const workingHours = this.workingHours();
    const [workEndHour] = workingHours.end.split(":").map(Number);

    if (endHour <= workEndHour) {
      const endTimeString = `${endHour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      this.form.update((current) => ({
        ...current,
        endTime: endTimeString,
      }));
      console.log("Auto-populated end time:", endTimeString);
    }
  }

  onCancel(): void {
    this.validationService.clearAllErrors();
    this.close.emit();
  }

  onDateChange(dateString: string): void {
    this.updateForm("appointmentDate", dateString);

    if (dateString) {
      const selectedDate = new Date(dateString);
      // Clear any previous date validation errors
      this.validationService.clearFieldError("appointmentDate");

      // Regenerate time slots for the new date
      this.generateTimeSlots();
    }
  }
}
