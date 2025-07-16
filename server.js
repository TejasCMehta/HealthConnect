const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Login endpoint
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  const user = db.users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // In a real app, you would hash the password properly
  // For testing, accept any password that isn't empty
  if (!password || password.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
    },
  });
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

// Settings routes (before generic CRUD routes)
app.get("/api/settings", (req, res) => {
  res.json(db.settings || {});
});

app.get("/api/settings/working-hours", (req, res) => {
  const workingHours = db.settings?.workingHours?.default || {
    start: "08:00",
    end: "18:00",
  };
  res.json(workingHours);
});

app.put("/api/settings/working-hours", (req, res) => {
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.workingHours = req.body;
  saveDb();
  res.json(db.settings.workingHours);
});

app.get("/api/settings/holidays", (req, res) => {
  const holidays = db.settings?.holidays || [];
  res.json(holidays);
});

app.put("/api/settings/holidays", (req, res) => {
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.holidays = req.body;
  saveDb();
  res.json(db.settings.holidays);
});

app.get("/api/settings/working-days", (req, res) => {
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
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.workingDays = req.body;
  saveDb();
  res.json(db.settings.workingDays);
});

// General settings update endpoint
app.put("/api/settings", (req, res) => {
  if (!db.settings) {
    db.settings = {};
  }

  // Merge the incoming settings with existing settings
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json(db.settings);
});

// Generic CRUD routes
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

const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express Server is running on port ${PORT}`);
});
