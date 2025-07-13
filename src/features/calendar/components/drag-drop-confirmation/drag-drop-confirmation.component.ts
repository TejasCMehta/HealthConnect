import { Component, input, output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DragDropConfirmation } from "../../services/appointment-drag-drop.service";
import { DoctorService } from "../../../doctors/services/doctor.service";

@Component({
  selector: "app-drag-drop-confirmation",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Appointment Move
          </h3>
          <button
            (click)="cancel.emit()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        @if (confirmationData()) {
        <div class="space-y-4">
          <!-- Appointment Title -->
          <div class="border-l-4 border-blue-500 pl-3">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ confirmationData()!.appointment.title }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ confirmationData()!.appointment.patient?.name }}
            </p>
          </div>

          <!-- Changes Summary -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Changes:
            </h5>

            @if (confirmationData()!.changes.timeChanged) {
            <div class="flex items-center text-sm mb-1">
              <svg
                class="w-4 h-4 text-blue-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">
                Time:
                {{ formatTime(confirmationData()!.appointment.startTime) }} -
                {{ formatTime(confirmationData()!.appointment.endTime) }}
                →
                {{ formatTime(confirmationData()!.newStartTime) }} -
                {{ formatTime(confirmationData()!.newEndTime) }}
              </span>
            </div>
            } @if (confirmationData()!.changes.doctorChanged) {
            <div class="flex items-center text-sm">
              <svg
                class="w-4 h-4 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <span class="text-gray-600 dark:text-gray-300">
                Doctor: {{ confirmationData()!.appointment.doctor?.name }}
                →
                {{ newDoctorName() }}
              </span>
            </div>
            } @if (!confirmationData()!.changes.timeChanged &&
            !confirmationData()!.changes.doctorChanged) {
            <div class="text-sm text-gray-500 dark:text-gray-400">
              No changes detected
            </div>
            }
          </div>

          <!-- Date and Duration -->
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <div class="flex justify-between">
              <span>Date:</span>
              <span>{{ formatDate(confirmationData()!.newStartTime) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Duration:</span>
              <span
                >{{
                  calculateDuration(
                    confirmationData()!.newStartTime,
                    confirmationData()!.newEndTime
                  )
                }}
                minutes</span
              >
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              (click)="cancel.emit()"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirm.emit()"
              [disabled]="isLoading()"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              @if (isLoading()) {
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Checking availability... } @else { Confirm Move }
            </button>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class DragDropConfirmationComponent {
  private doctorService = inject(DoctorService);

  public confirmationData = input<DragDropConfirmation | null>(null);
  public isLoading = input<boolean>(false);

  public confirm = output<void>();
  public cancel = output<void>();

  public newDoctorName(): string {
    const data = this.confirmationData();
    if (!data) return "";

    // If doctor changed, we need to look up the new doctor name
    if (data.changes.doctorChanged && data.newDoctor) {
      return data.newDoctor.name;
    }

    // If doctor didn't change, return current doctor name
    return data.appointment.doctor?.name || "Unknown Doctor";
  }

  public formatTime(timeString: string): string {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  public formatDate(timeString: string): string {
    const date = new Date(timeString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  public calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }
}
