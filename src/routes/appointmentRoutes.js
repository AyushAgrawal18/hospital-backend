const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, bookAppointment);
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateAppointmentStatus,
);

module.exports = router;
