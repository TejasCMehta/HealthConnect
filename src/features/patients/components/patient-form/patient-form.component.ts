import {
  Component,
  input,
  output,
  signal,
  inject,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Patient } from "../../../../shared/models/patient.model";
import { PatientService } from "../../services/patient.service";
import { ToasterService } from "../../../../shared/services/toaster.service";
import { FormValidationService } from "../../../../shared/services/form-validation.service";
import { FieldErrorComponent } from "../../../../shared/components/field-error/field-error.component";

@Component({
  selector: "app-patient-form",
  standalone: true,
  imports: [CommonModule, FormsModule, FieldErrorComponent],
  templateUrl: "./patient-form.component.html",
  styleUrl: "./patient-form.component.scss",
})
export class PatientFormComponent implements OnInit {
  private patientService = inject(PatientService);
  private toasterService = inject(ToasterService);
  public validationService = inject(FormValidationService);

  public patient = input<Patient | null>(null);
  public close = output<void>();
  public save = output<void>();

  public isLoading = signal(false);
  public error = signal("");

  public form = signal({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
  });

  ngOnInit(): void {
    const patient = this.patient();
    if (patient) {
      this.form.set({
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address,
      });
    }
  }

  onSubmit(): void {
    // Clear previous validation errors
    this.validationService.clearAllErrors();

    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set("");

    const formData = this.form();
    const operation = this.patient()
      ? this.patientService.updatePatient(this.patient()!.id, formData)
      : this.patientService.createPatient(formData);

    operation.subscribe({
      next: () => {
        const isUpdate = !!this.patient();
        this.toasterService.showSuccess(
          isUpdate ? "Patient Updated" : "Patient Created",
          isUpdate
            ? "The patient has been successfully updated."
            : "The patient has been successfully created."
        );
        this.save.emit();
      },
      error: (error) => {
        this.toasterService.showError(
          "Error",
          error.message || "An error occurred while saving the patient"
        );
        this.isLoading.set(false);
      },
    });
  }

  private validateForm(): boolean {
    const form = this.form();
    let isValid = true;

    // Validate required fields
    if (!this.validationService.validateRequired(form.name.trim(), "name")) {
      isValid = false;
    }

    if (!this.validationService.validateRequired(form.email.trim(), "email")) {
      isValid = false;
    } else if (!this.validationService.validateEmail(form.email, "email")) {
      isValid = false;
    }

    if (!this.validationService.validateRequired(form.phone.trim(), "phone")) {
      isValid = false;
    } else if (!this.validationService.validatePhone(form.phone, "phone")) {
      isValid = false;
    }

    if (
      !this.validationService.validateRequired(form.dateOfBirth, "dateOfBirth")
    ) {
      isValid = false;
    } else if (
      !this.validationService.validateDate(form.dateOfBirth, "dateOfBirth")
    ) {
      isValid = false;
    }

    if (
      !this.validationService.validateRequired(form.address.trim(), "address")
    ) {
      isValid = false;
    }

    return isValid;
  }

  updateForm(field: string, value: any): void {
    this.form.update((current) => ({
      ...current,
      [field]: value,
    }));

    // Clear validation error when user starts typing
    if (value) {
      this.validationService.clearFieldError(field);
    }
  }

  onCancel(): void {
    this.validationService.clearAllErrors();
    this.close.emit();
  }
}
