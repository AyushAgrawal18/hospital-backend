const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Admin and staff can view all patients
router.get("/", authorize("admin", "staff"), patientController.getAllPatients);

// Patient specific routes
router.get("/me", authorize("patient"), patientController.getPatientProfile);
router.put("/me", authorize("patient"), patientController.updatePatientProfile);

module.exports = router;
