const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
// Use express.json for all routes EXCEPT the Stripe webhook, which requires the raw body
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

const db = require("./config/db");
const doctorRoutes = require("./modules/doctor/doctor.routes");

const path = require("path");

const authRoutes = require("./modules/auth/auth.routes");
const patientRoutes = require("./modules/patient/patient.routes");

const appointmentRoutes = require("./modules/appointment/appointment.routes");
const paymentRoutes = require("./modules/payment/payment.routes");

app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/patients", patientRoutes);

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
