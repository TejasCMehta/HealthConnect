import { Injectable, signal } from "@angular/core";

export interface FieldError {
  field: string;
  message: string;
}

export interface FormValidationState {
  [key: string]: string | null;
}

@Injectable({
  providedIn: "root",
})
export class FormValidationService {
  private validationErrors = signal<FormValidationState>({});

  public readonly errors = this.validationErrors.asReadonly();

  setFieldError(field: string, message: string | null): void {
    this.validationErrors.update((current) => ({
      ...current,
      [field]: message,
    }));
  }

  clearFieldError(field: string): void {
    this.validationErrors.update((current) => {
      const updated = { ...current };
      delete updated[field];
      return updated;
    });
  }

  clearAllErrors(): void {
    this.validationErrors.set({});
  }

  getFieldError(field: string): string | null {
    return this.validationErrors()[field] || null;
  }

  hasErrors(): boolean {
    const errors = this.validationErrors();
    return Object.keys(errors).some((key) => errors[key] !== null);
  }

  getErrorCount(): number {
    const errors = this.validationErrors();
    return Object.keys(errors).filter((key) => errors[key] !== null).length;
  }

  // Validation helper methods
  validateRequired(value: any, fieldName: string): boolean {
    if (!value || (typeof value === "string" && !value.trim())) {
      this.setFieldError(
        fieldName,
        `${this.formatFieldName(fieldName)} is required`
      );
      return false;
    }
    this.clearFieldError(fieldName);
    return true;
  }

  validateEmail(value: string, fieldName: string): boolean {
    if (!value) return true; // Let required validation handle empty values

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.setFieldError(fieldName, "Please enter a valid email address");
      return false;
    }
    this.clearFieldError(fieldName);
    return true;
  }

  validateMinLength(
    value: string,
    minLength: number,
    fieldName: string
  ): boolean {
    if (!value) return true; // Let required validation handle empty values

    if (value.length < minLength) {
      this.setFieldError(
        fieldName,
        `${this.formatFieldName(
          fieldName
        )} must be at least ${minLength} characters long`
      );
      return false;
    }
    this.clearFieldError(fieldName);
    return true;
  }

  validateMaxLength(
    value: string,
    maxLength: number,
    fieldName: string
  ): boolean {
    if (!value) return true; // Let required validation handle empty values

    if (value.length > maxLength) {
      this.setFieldError(
        fieldName,
        `${this.formatFieldName(
          fieldName
        )} must not exceed ${maxLength} characters`
      );
      return false;
    }
    this.clearFieldError(fieldName);
    return true;
  }

  validatePhone(value: string, fieldName: string): boolean {
    if (!value) return true; // Let required validation handle empty values

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
      this.setFieldError(fieldName, "Please enter a valid phone number");
      return false;
    }
    this.clearFieldError(fieldName);
    return true;
  }

  validateDate(
    value: string,
    fieldName: string,
    futureOnly: boolean = false
  ): boolean {
    if (!value) return true; // Let required validation handle empty values

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.setFieldError(fieldName, "Please enter a valid date");
      return false;
    }

    if (futureOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        this.setFieldError(
          fieldName,
          `${this.formatFieldName(fieldName)} cannot be in the past`
        );
        return false;
      }
    }

    this.clearFieldError(fieldName);
    return true;
  }

  validateSelection(
    value: string | number,
    fieldName: string,
    invalidValues: (string | number | null | undefined)[] = [
      "0",
      "",
      null,
      undefined,
    ]
  ): boolean {
    if (invalidValues.includes(value)) {
      this.setFieldError(
        fieldName,
        `Please select a ${this.formatFieldName(fieldName).toLowerCase()}`
      );
      return false;
    }
    this.clearFieldError(fieldName);
    return true;
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
