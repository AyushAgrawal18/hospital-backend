const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createStripeSession,
  createRazorpayOrder,
  verifyPayment,
} = require("../controllers/paymentController");

router.post("/stripe/create-session", protect, createStripeSession);
router.post("/razorpay/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;
