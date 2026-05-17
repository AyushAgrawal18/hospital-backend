const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const patientModel = require("../models/patientModel");
const appointmentModel = require("../models/appointmentModel");
const doctorModel = require("../models/doctorModel");


exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, name, email, phone, appointmentTime } = req.body;

  if (!doctorId || !name || !appointmentTime) {
    const error = new Error("Required fields missing");
    error.statusCode = 400;
    throw error;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const patientId = await patientModel.create(connection, name, email, phone);

    const appointmentId = await appointmentModel.create(
      connection,
      doctorId,
      patientId,
      appointmentTime,
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Appointment booked",
      appointmentId,
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }
    throw error;
  } finally {
    connection.release();
  }
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["booked", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  const [rows] = await db.query(
    "SELECT status FROM appointments WHERE id = ?",
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found",
    });
  }

  const currentStatus = rows[0].status;

  if (currentStatus !== "booked") {
    return res.status(400).json({
      success: false,
      message: "Cannot modify completed or cancelled appointment",
    });
  }

  await db.query("UPDATE appointments SET status = ? WHERE id = ?", [
    status,
    id,
  ]);

  res.json({
    success: true,
    message: "Appointment status updated",
  });
});

exports.getMyAppointments = asyncHandler(async (req, res) => {

// Admin & staff see all appointments
if (req.user.role === "admin" || req.user.role === "staff") {

const [rows] = await db.query(
  `SELECT 
      appointments.id,
      appointments.appointment_time,
      appointments.status,
      patients.name AS patient_name,
      doctors.name AS doctor_name
   FROM appointments
   JOIN patients ON appointments.patient_id = patients.id
   JOIN doctors ON appointments.doctor_id = doctors.id
   ORDER BY appointment_time ASC`
);

return res.json({
  success: true,
  count: rows.length,
  data: rows,
});

}

// Doctor sees only own appointments
if (req.user.role === "doctor") {

const doctor = await doctorModel.findByUserId(req.user.id);

if (!doctor) {
  return res.status(404).json({
    success: false,
    message: "Doctor profile not found",
  });
}

const appointments =
  await appointmentModel.findAppointmentsByDoctorId(doctor.id);

return res.json({
  success: true,
  count: appointments.length,
  data: appointments,
});

}

res.status(403).json({
success: false,
message: "Access denied",
});
});

