#!/usr/bin/env node

// Simple script to test production build locally
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from Angular production build
app.use(express.static(path.join(__dirname, "dist/clinic-portal")));

// Handle Angular routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/clinic-portal/index.html"));
});

app.listen(PORT, () => {
  console.log(`Testing production build at http://localhost:${PORT}`);
  console.log("API should use relative URLs (no localhost:8000)");
});
