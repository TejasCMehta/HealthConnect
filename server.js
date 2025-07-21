const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "https://healthconnect-cc41.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path}`,
    req.body
  );
  next();
});

// Load database
let db;
try {
  const dbPath = path.join(__dirname, "db.json");
  db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
} catch (error) {
  console.error("Error loading database:", error);
  db = {
    users: [],
    patients: [],
    doctors: [],
    appointments: [],
    settings: {},
  };
}

// Save database
function saveDb() {
  try {
    fs.writeFileSync(
      path.join(__dirname, "db.json"),
      JSON.stringify(db, null, 2)
    );
  } catch (error) {
    console.error("Error saving database:", error);
  }
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Health check endpoint for Render (must be before protected middleware)
app.get("/api/health", (req, res) => {
  console.log("Health check endpoint hit");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "HealthConnect Clinic API",
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 8000,
  });
});

// Also add a root health check
app.get("/health", (req, res) => {
  console.log("Root health check endpoint hit");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "HealthConnect Clinic API",
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 8000,
  });
});

// Login endpoint
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  console.log("Login attempt:", {
    username,
    password: password ? "***" : "empty",
  });

  const user = db.users.find((u) => u.username === username);

  if (!user) {
    console.log("User not found:", username);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // For demo purposes, accept any non-empty password
  // In production, you would use bcrypt.compare(password, user.password)
  if (!password || password.length === 0) {
    console.log("Empty password provided");
    return res.status(401).json({ error: "Invalid credentials" });
  }

  console.log("Login successful for user:", user.username);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: "24h" }
  );

  const response = {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
    },
  };

  console.log("Sending response:", { ...response, token: "***" });
  res.json(response);
});

// Protected routes middleware
app.use("/api", isAuthenticated);

// Custom routes for pagination and filtering
app.get("/api/patients", (req, res) => {
  const { _page = 1, _limit = 10, _sort, _order, q } = req.query;

  let patients = [...db.patients];

  // Search functionality
  if (q) {
    patients = patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(q.toLowerCase()) ||
        patient.email.toLowerCase().includes(q.toLowerCase()) ||
        patient.phone.includes(q)
    );
  }

  // Sorting
  if (_sort) {
    patients = patients.sort((a, b) => {
      const aVal = a[_sort];
      const bVal = b[_sort];

      if (_order === "desc") {
        return aVal < bVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  }

  // Pagination
  const total = patients.length;
  const start = (_page - 1) * _limit;
  const end = start + parseInt(_limit);
  const paginatedPatients = patients.slice(start, end);

  res.json({
    data: paginatedPatients,
    total,
    page: parseInt(_page),
    limit: parseInt(_limit),
    totalPages: Math.ceil(total / _limit),
  });
});

// Settings routes (before generic CRUD routes) - ADMIN ONLY
app.get("/api/settings", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  res.json(db.settings || {});
});

app.get("/api/settings/working-hours", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  const workingHours = db.settings?.workingHours?.default || {
    start: "08:00",
    end: "18:00",
  };
  res.json(workingHours);
});

app.put("/api/settings/working-hours", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.workingHours = req.body;
  saveDb();
  res.json(db.settings.workingHours);
});

app.get("/api/settings/holidays", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  const holidays = db.settings?.holidays || [];
  res.json(holidays);
});

app.put("/api/settings/holidays", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.holidays = req.body;
  saveDb();
  res.json(db.settings.holidays);
});

app.get("/api/settings/working-days", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  const workingDays = db.settings?.workingDays || {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  };
  res.json(workingDays);
});

app.put("/api/settings/working-days", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.workingDays = req.body;
  saveDb();
  res.json(db.settings.workingDays);
});

// General settings update endpoint
app.put("/api/settings", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  if (!db.settings) {
    db.settings = {};
  }

  // Merge the incoming settings with existing settings
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json(db.settings);
});

// Role-based appointments route (must be before generic CRUD routes)
app.get("/api/appointments", (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  console.log(
    `Appointments request from user: ${req.user.username} (${userRole})`
  );

  let appointments = [...db.appointments];

  // If user is a doctor, only show their appointments
  if (userRole === "doctor") {
    appointments = appointments.filter(
      (appointment) => appointment.doctorId === userId
    );
    console.log(
      `Filtered ${appointments.length} appointments for doctor ${userId}`
    );
  }

  res.json(appointments);
});

// Role-based appointment creation
app.post("/api/appointments", (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  // Only admins can create appointments for any doctor
  // Doctors can only create appointments for themselves
  if (userRole === "doctor" && req.body.doctorId !== userId) {
    return res
      .status(403)
      .json({ error: "Doctors can only create appointments for themselves" });
  }

  const newAppointment = {
    id: Date.now(),
    ...req.body,
  };

  db.appointments.push(newAppointment);
  saveDb();

  res.status(201).json(newAppointment);
});

// Role-based appointment update
app.put("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userId = req.user.id;

  const appointmentIndex = db.appointments.findIndex(
    (item) => item.id === parseInt(id)
  );

  if (appointmentIndex === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  const appointment = db.appointments[appointmentIndex];

  // Check if doctor is trying to modify someone else's appointment
  if (userRole === "doctor" && appointment.doctorId !== userId) {
    return res
      .status(403)
      .json({ error: "Doctors can only modify their own appointments" });
  }

  // If doctor is changing doctorId, ensure it's to themselves
  if (
    userRole === "doctor" &&
    req.body.doctorId &&
    req.body.doctorId !== userId
  ) {
    return res
      .status(403)
      .json({ error: "Doctors can only assign appointments to themselves" });
  }

  db.appointments[appointmentIndex] = { ...appointment, ...req.body };
  saveDb();

  res.json(db.appointments[appointmentIndex]);
});

// Role-based appointment deletion
app.delete("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;
  const userId = req.user.id;

  const appointmentIndex = db.appointments.findIndex(
    (item) => item.id === parseInt(id)
  );

  if (appointmentIndex === -1) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  const appointment = db.appointments[appointmentIndex];

  // Check if doctor is trying to delete someone else's appointment
  if (userRole === "doctor" && appointment.doctorId !== userId) {
    return res
      .status(403)
      .json({ error: "Doctors can only delete their own appointments" });
  }

  db.appointments.splice(appointmentIndex, 1);
  saveDb();

  res.json({ success: true });
});

// Restrict doctors and patients management to admins only
app.get("/api/doctors", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }
  res.json(db.doctors || []);
});

app.post("/api/doctors", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }

  const newDoctor = {
    id: Date.now(),
    ...req.body,
  };

  db.doctors.push(newDoctor);
  saveDb();

  res.status(201).json(newDoctor);
});

app.put("/api/doctors/:id", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }

  const { id } = req.params;
  const doctorIndex = db.doctors.findIndex((item) => item.id === parseInt(id));

  if (doctorIndex === -1) {
    return res.status(404).json({ error: "Doctor not found" });
  }

  db.doctors[doctorIndex] = { ...db.doctors[doctorIndex], ...req.body };
  saveDb();

  res.json(db.doctors[doctorIndex]);
});

app.delete("/api/doctors/:id", (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }

  const { id } = req.params;
  const doctorIndex = db.doctors.findIndex((item) => item.id === parseInt(id));

  if (doctorIndex === -1) {
    return res.status(404).json({ error: "Doctor not found" });
  }

  db.doctors.splice(doctorIndex, 1);
  saveDb();

  res.json({ success: true });
});

// Patient routes with role-based access control (must be before generic CRUD routes)
app.post("/api/patients", (req, res) => {
  // Both doctors and admins can add patients
  if (req.user.role !== "admin" && req.user.role !== "doctor") {
    return res
      .status(403)
      .json({ error: "Access denied. Doctor or Admin privileges required." });
  }

  const newPatient = {
    id: Date.now(),
    ...req.body,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };

  db.patients.push(newPatient);
  saveDb();
  res.status(201).json(newPatient);
});

app.put("/api/patients/:id", (req, res) => {
  // Both doctors and admins can edit patients
  if (req.user.role !== "admin" && req.user.role !== "doctor") {
    return res
      .status(403)
      .json({ error: "Access denied. Doctor or Admin privileges required." });
  }

  const { id } = req.params;
  const index = db.patients.findIndex((patient) => patient.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  db.patients[index] = {
    ...db.patients[index],
    ...req.body,
    updatedBy: req.user.id,
    updatedAt: new Date().toISOString(),
  };
  saveDb();
  res.json(db.patients[index]);
});

app.delete("/api/patients/:id", (req, res) => {
  // Only admins can delete patients
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }

  const { id } = req.params;
  const index = db.patients.findIndex((patient) => patient.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ error: "Patient not found" });
  }

  db.patients.splice(index, 1);
  saveDb();
  res.json({ success: true });
});

// Generic CRUD routes (moved after specific routes)
app.get("/api/:resource", (req, res) => {
  const { resource } = req.params;
  const data = db[resource] || [];
  res.json(data);
});

app.get("/api/:resource/:id", (req, res) => {
  const { resource, id } = req.params;
  const data = db[resource] || [];
  const item = data.find((item) => item.id === parseInt(id));

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json(item);
});

app.post("/api/:resource", (req, res) => {
  const { resource } = req.params;
  const data = db[resource] || [];
  const newItem = {
    id: Date.now(),
    ...req.body,
  };

  data.push(newItem);
  saveDb();

  res.status(201).json(newItem);
});

app.put("/api/:resource/:id", (req, res) => {
  const { resource, id } = req.params;
  const data = db[resource] || [];
  const index = data.findIndex((item) => item.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  data[index] = { ...data[index], ...req.body };
  saveDb();

  res.json(data[index]);
});

app.delete("/api/:resource/:id", (req, res) => {
  const { resource, id } = req.params;
  const data = db[resource] || [];
  const index = data.findIndex((item) => item.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  data.splice(index, 1);
  saveDb();

  res.json({ success: true });
});

// Serve static files from Angular build
app.use(express.static(path.join(__dirname, "dist/clinic-portal")));

// Handle Angular routing - serve index.html for any non-API routes
app.get("*", (req, res) => {
  // Skip API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/auth/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(__dirname, "dist/clinic-portal/index.html"));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`Database loaded with ${db.users?.length || 0} users`);
});
