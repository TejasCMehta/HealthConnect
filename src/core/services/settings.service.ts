// ...existing code...

export class SettingsService {
  // ...existing code...

  public getStatusColor(status: string): string {
    // Replace with your actual settings retrieval logic
    // Example fallback:
    const defaultColors: { [key: string]: string } = {
      scheduled: "#3B82F6",
      confirmed: "#10B981",
      cancelled: "#EF4444",
      completed: "#059669",
      "no-show": "#9CA3AF",
    };
    const key = status.toLowerCase();
    return defaultColors[key] || "#6B7280";
  }

  // ...existing code...
}
