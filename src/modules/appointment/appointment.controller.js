const db = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");
const patientModel = require("../patient/patient.model");
const appointmentModel = require("./appointment.model");
const doctorModel = require("../doctor/doctor.model");


exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctor_id, doctorId, appointment_date, appointment_time, appointmentTime, name, email, phone } = req.body;

  const finalDoctorId = doctor_id || doctorId;
  const finalAppointmentTime = (appointment_date && appointment_time) 
    ? `${appointment_date} ${appointment_time}:00` 
    : appointmentTime;

  if (!finalDoctorId || !finalAppointmentTime) {
    const error = new Error("Required fields missing");
    error.statusCode = 400;
    throw error;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let patientId;
    if (req.user && req.user.role === "patient") {
      const patient = await patientModel.findByUserId(req.user.id);
      if (!patient) {
        throw new Error("Patient profile not found");
      }
      patientId = patient.id;
    } else {
      if (!name || !email) {
        throw new Error("Patient name and email are required for manual booking");
      }
      patientId = await patientModel.create(connection, name, email, phone);
    }

    const appointmentId = await appointmentModel.create(
      connection,
      finalDoctorId,
      patientId,
      finalAppointmentTime,
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Appointment booked",
      appointmentId: appointmentId
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }
    if (error.message === "Patient profile not found") {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found. Please complete your profile first."
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

// Patient sees only own appointments
if (req.user.role === "patient") {
  const patient = await patientModel.findByUserId(req.user.id);

  if (!patient) {
    return res.json({
      success: true,
      count: 0,
      data: [],
      message: "Patient profile not completed yet.",
    });
  }

  const [rows] = await db.query(
    `SELECT 
        appointments.id,
        appointments.appointment_time,
        appointments.status,
        appointments.payment_status,
        doctors.name AS doctor_name,
        doctors.consultation_fee
     FROM appointments
     JOIN doctors ON appointments.doctor_id = doctors.id
     WHERE appointments.patient_id = ?
     ORDER BY appointment_time ASC`,
     [patient.id]
  );

  return res.json({
    success: true,
    count: rows.length,
    data: rows,
  });
}

res.status(403).json({
success: false,
message: "Access denied",
});
});

