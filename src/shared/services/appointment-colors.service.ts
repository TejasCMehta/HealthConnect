import { Injectable } from "@angular/core";

export interface ColorOption {
  name: string;
  backgroundClass: string;
  textClass: string;
  borderClass: string;
  darkBackgroundClass: string;
  darkTextClass: string;
  value: string;
}

export interface AppointmentColorClasses {
  background: string;
  text: string;
  border: string;
}

@Injectable({
  providedIn: "root",
})
export class AppointmentColorsService {
  private readonly colorOptions: ColorOption[] = [
    {
      name: "Blue",
      backgroundClass: "bg-blue-50",
      textClass: "text-blue-800",
      borderClass: "border-blue-400",
      darkBackgroundClass: "dark:bg-blue-900/10",
      darkTextClass: "dark:text-blue-300",
      value: "blue",
    },
    {
      name: "Green",
      backgroundClass: "bg-green-50",
      textClass: "text-green-800",
      borderClass: "border-green-400",
      darkBackgroundClass: "dark:bg-green-900/10",
      darkTextClass: "dark:text-green-300",
      value: "green",
    },
    {
      name: "Red",
      backgroundClass: "bg-red-50",
      textClass: "text-red-800",
      borderClass: "border-red-400",
      darkBackgroundClass: "dark:bg-red-900/10",
      darkTextClass: "dark:text-red-300",
      value: "red",
    },
    {
      name: "Yellow",
      backgroundClass: "bg-yellow-50",
      textClass: "text-yellow-800",
      borderClass: "border-yellow-400",
      darkBackgroundClass: "dark:bg-yellow-900/10",
      darkTextClass: "dark:text-yellow-300",
      value: "yellow",
    },
    {
      name: "Purple",
      backgroundClass: "bg-purple-50",
      textClass: "text-purple-800",
      borderClass: "border-purple-400",
      darkBackgroundClass: "dark:bg-purple-900/10",
      darkTextClass: "dark:text-purple-300",
      value: "purple",
    },
    {
      name: "Indigo",
      backgroundClass: "bg-indigo-50",
      textClass: "text-indigo-800",
      borderClass: "border-indigo-400",
      darkBackgroundClass: "dark:bg-indigo-900/10",
      darkTextClass: "dark:text-indigo-300",
      value: "indigo",
    },
    {
      name: "Pink",
      backgroundClass: "bg-pink-50",
      textClass: "text-pink-800",
      borderClass: "border-pink-400",
      darkBackgroundClass: "dark:bg-pink-900/10",
      darkTextClass: "dark:text-pink-300",
      value: "pink",
    },
    {
      name: "Gray",
      backgroundClass: "bg-gray-50",
      textClass: "text-gray-800",
      borderClass: "border-gray-400",
      darkBackgroundClass: "dark:bg-gray-900/10",
      darkTextClass: "dark:text-gray-300",
      value: "gray",
    },
    {
      name: "Emerald",
      backgroundClass: "bg-emerald-50",
      textClass: "text-emerald-800",
      borderClass: "border-emerald-400",
      darkBackgroundClass: "dark:bg-emerald-900/10",
      darkTextClass: "dark:text-emerald-300",
      value: "emerald",
    },
    {
      name: "Orange",
      backgroundClass: "bg-orange-50",
      textClass: "text-orange-800",
      borderClass: "border-orange-400",
      darkBackgroundClass: "dark:bg-orange-900/10",
      darkTextClass: "dark:text-orange-300",
      value: "orange",
    },
  ];

  /**
   * Get all available color options
   */
  getColorOptions(): ColorOption[] {
    return this.colorOptions;
  }

  /**
   * Get color option by value
   */
  getColorOption(value: string): ColorOption {
    // Handle legacy hex colors by mapping them to our color names
    const hexToColorMap: { [hex: string]: string } = {
      "#3B82F6": "blue",
      "#3b82f6": "blue",
      "#10B981": "green",
      "#10b981": "green",
      "#EF4444": "red",
      "#ef4444": "red",
      "#059669": "emerald",
      "#9CA3AF": "gray",
      "#9ca3af": "gray",
      "#F59E0B": "yellow",
      "#f59e0b": "yellow",
      "#8B5CF6": "purple",
      "#8b5cf6": "purple",
    };

    // If it's a hex color, convert it to our color name
    if (value.startsWith("#")) {
      const mappedColor = hexToColorMap[value];
      if (mappedColor) {
        value = mappedColor;
      } else {
        // Default to blue for unknown hex colors
        value = "blue";
      }
    }

    return (
      this.colorOptions.find((option) => option.value === value) ||
      this.colorOptions[0]
    );
  }
  /**
   * Get Tailwind CSS classes for a status based on its color value
   */
  getStatusColorClasses(colorValue: string): AppointmentColorClasses {
    const colorOption = this.getColorOption(colorValue);
    return {
      background: `${colorOption.backgroundClass} ${colorOption.darkBackgroundClass}`,
      text: `${colorOption.textClass} ${colorOption.darkTextClass}`,
      border: colorOption.borderClass,
    };
  }

  /**
   * Get badge color classes (more prominent) for status indicators
   */
  getStatusBadgeClasses(colorValue: string): AppointmentColorClasses {
    const colorOption = this.getColorOption(colorValue);
    // Using 100 shade for badge background and same text color
    const badgeBackground = colorOption.backgroundClass.replace("50", "100");
    return {
      background: `${badgeBackground} ${colorOption.darkBackgroundClass}`,
      text: `${colorOption.textClass} ${colorOption.darkTextClass}`,
      border: colorOption.borderClass,
    };
  }

  /**
   * Default color mappings for appointment statuses
   */
  getDefaultStatusColors() {
    return {
      scheduled: "blue",
      confirmed: "green",
      cancelled: "red",
      completed: "emerald",
      "no-show": "yellow",
    };
  }
}
