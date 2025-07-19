export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
  patient?: Patient;
  doctor?: Doctor;
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  color: string;
}
