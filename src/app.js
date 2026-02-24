const express = require("express");

const app = express();
app.use(express.json());

const db = require("./config/db");
const doctorRoutes = require("./routes/doctorRoutes");

const path = require("path");

const authRoutes = require("./routes/authRoutes");

const appointmentRoutes = require("./routes/appointmentRoutes");

app.use("/api/appointments", appointmentRoutes);

app.use("/api/auth", authRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("Hospital API Running");
});
app.use("/api/doctors", doctorRoutes);

app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({ message: "Database Connected", rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const errorHandler = require("./middleware/errorMiddleware");

app.use(errorHandler);

module.exports = app;
