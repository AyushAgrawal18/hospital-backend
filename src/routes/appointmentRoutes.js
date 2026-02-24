const express = require("express");
const router = express.Router();
const { bookAppointment } = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, bookAppointment);

module.exports = router;
