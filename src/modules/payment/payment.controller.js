const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "dummy_key");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../../config/db");
const asyncHandler = require("../../utils/asyncHandler");

// Helper to fetch appointment with doctor and patient details
const getAppointmentDetails = async (appointmentId) => {
  const [rows] = await db.query(
    `SELECT a.id, a.status, a.payment_status, d.consultation_fee, d.name as doctor_name, p.name as patient_name, p.email as patient_email
     FROM appointments a 
     JOIN doctors d ON a.doctor_id = d.id 
     JOIN patients p ON a.patient_id = p.id 
     WHERE a.id = ?`,
    [appointmentId]
  );
  return rows[0];
};

exports.createStripeSession = asyncHandler(async (req, res, next) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    const error = new Error("Appointment ID is required");
    error.statusCode = 400;
    throw error;
  }

  const appointment = await getAppointmentDetails(appointmentId);

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.payment_status === "completed") {
    const error = new Error("Appointment is already paid");
    error.statusCode = 400;
    throw error;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Consultation with ${appointment.doctor_name}`,
            description: `Patient: ${appointment.patient_name}`,
          },
          unit_amount: Math.round(appointment.consultation_fee * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/payment-success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointmentId}`,
    cancel_url: `${req.protocol}://${req.get("host")}/payment-cancel`,
  });

  // Save the payment_id (session ID) to the appointment
  await db.query("UPDATE appointments SET payment_id = ? WHERE id = ?", [session.id, appointmentId]);

  res.json({ success: true, sessionId: session.id, url: session.url });
});

exports.createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    const error = new Error("Appointment ID is required");
    error.statusCode = 400;
    throw error;
  }

  const appointment = await getAppointmentDetails(appointmentId);

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (appointment.payment_status === "completed") {
    const error = new Error("Appointment is already paid");
    error.statusCode = 400;
    throw error;
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: Math.round(appointment.consultation_fee * 100), // Razorpay uses paise
    currency: "INR",
    receipt: `receipt_order_${appointmentId}`,
  };

  const order = await razorpay.orders.create(options);

  // Save the payment_id (order ID) to the appointment
  await db.query("UPDATE appointments SET payment_id = ? WHERE id = ?", [order.id, appointmentId]);

  res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency });
});

exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { appointmentId, provider, razorpay_order_id, razorpay_payment_id, razorpay_signature, stripe_session_id } = req.body;

  if (!appointmentId || !provider) {
    const error = new Error("Appointment ID and provider are required");
    error.statusCode = 400;
    throw error;
  }

  if (provider === "razorpay") {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const error = new Error("Razorpay payment details are missing");
      error.statusCode = 400;
      throw error;
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      const error = new Error("Invalid Razorpay signature");
      error.statusCode = 400;
      throw error;
    }

    // Update appointment status
    await db.query("UPDATE appointments SET payment_status = 'completed' WHERE id = ?", [appointmentId]);
    return res.json({ success: true, message: "Payment verified successfully" });
  }

  if (provider === "stripe") {
    if (!stripe_session_id) {
      const error = new Error("Stripe session ID is missing");
      error.statusCode = 400;
      throw error;
    }

    const session = await stripe.checkout.sessions.retrieve(stripe_session_id);

    if (session.payment_status !== "paid") {
      const error = new Error("Stripe payment not successful");
      error.statusCode = 400;
      throw error;
    }

    // Update appointment status
    await db.query("UPDATE appointments SET payment_status = 'completed' WHERE id = ?", [appointmentId]);
    return res.json({ success: true, message: "Payment verified successfully" });
  }

  const error = new Error("Invalid provider");
  error.statusCode = 400;
  throw error;
});

exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // session.id is our payment_id
    await db.query("UPDATE appointments SET payment_status = 'completed' WHERE payment_id = ?", [session.id]);
  }

  res.json({ received: true });
});

exports.razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return res.status(400).send("No signature found");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "order.paid") {
    const order = event.payload.order.entity;
    // order.id is our payment_id
    await db.query("UPDATE appointments SET payment_status = 'completed' WHERE payment_id = ?", [order.id]);
  }

  res.json({ status: "ok" });
});
