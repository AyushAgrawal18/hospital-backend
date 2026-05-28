const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createStripeSession,
  createRazorpayOrder,
  verifyPayment,
  stripeWebhook,
  razorpayWebhook
} = require("../controllers/paymentController");

router.post("/stripe/create-session", protect, createStripeSession);
router.post("/razorpay/create-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyPayment);

// Webhook routes (no protect middleware, they are called by Stripe/Razorpay)
router.post("/webhook/stripe", express.raw({ type: 'application/json' }), stripeWebhook);
router.post("/webhook/razorpay", razorpayWebhook);

module.exports = router;
