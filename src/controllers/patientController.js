const patientModel = require("../models/patientModel");
const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

// Admin/Staff: Get all patients
exports.getAllPatients = asyncHandler(async (req, res) => {
  const patients = await patientModel.findAll();
  res.json({
    success: true,
    count: patients.length,
    data: patients,
  });
});

// Patient: Get own profile
exports.getPatientProfile = asyncHandler(async (req, res) => {
  const patient = await patientModel.findByUserId(req.user.id);

  if (!patient) {
    return res.json({
      success: true,
      data: null,
      message: "Patient profile not found",
    });
  }

  res.json({
    success: true,
    data: patient,
  });
});

// Patient: Update own profile
exports.updatePatientProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    const error = new Error("Name, email, and phone are required");
    error.statusCode = 400;
    throw error;
  }

  const patient = await patientModel.findByUserId(req.user.id);

  if (!patient) {
    // If patient doesn't exist, we could create one, but let's assume they should exist
    // Or we can create one here since they might have just registered
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const insertId = await patientModel.create(connection, name, email, phone, req.user.id);
      await connection.commit();
      return res.status(201).json({
        success: true,
        message: "Patient profile created",
        patientId: insertId,
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // Update existing
  await patientModel.update(patient.id, name, email, phone);

  res.json({
    success: true,
    message: "Patient profile updated",
  });
});
