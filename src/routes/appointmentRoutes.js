const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  updateAppointmentStatus,
  getMyAppointments,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// router.post("/", protect, bookAppointment);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateAppointmentStatus,
);

router.post("/", protect, authorize("admin", "staff"), bookAppointment);

router.get("/my", protect, getMyAppointments);

module.exports = router;
