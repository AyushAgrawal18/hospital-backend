const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const patientModel = require("../models/patientModel");
const appointmentModel = require("../models/appointmentModel");

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
