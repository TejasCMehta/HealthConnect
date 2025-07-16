import { Component, input, output, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ClinicInfo } from "../../services/settings.service";

@Component({
  selector: "app-clinic-info",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          <i class="ri-hospital-line mr-2"></i>
          Clinic Information
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Basic information about your clinic
        </p>
      </div>
      <form (ngSubmit)="onSubmit()" class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Clinic Name
            </label>
            <input
              type="text"
              [(ngModel)]="formData.name"
              name="clinicName"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              [(ngModel)]="formData.phone"
              name="clinicPhone"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              [(ngModel)]="formData.email"
              name="clinicEmail"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Website
            </label>
            <input
              type="url"
              [(ngModel)]="formData.website"
              name="clinicWebsite"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Address
          </label>
          <textarea
            [(ngModel)]="formData.address"
            name="clinicAddress"
            rows="3"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          ></textarea>
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            [disabled]="isSaving()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            @if (isSaving()) {
            <i class="ri-loader-4-line animate-spin mr-2"></i>
            Saving... } @else {
            <i class="ri-save-line mr-2"></i>
            Save Changes }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ClinicInfoComponent implements OnInit {
  public clinicInfo = input<ClinicInfo>({
    name: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    website: "",
  });

  public isSaving = input<boolean>(false);
  public save = output<ClinicInfo>();

  public formData: ClinicInfo = {
    name: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    website: "",
  };

  ngOnInit(): void {
    this.formData = { ...this.clinicInfo() };
  }

  onSubmit(): void {
    this.save.emit(this.formData);
  }
}
