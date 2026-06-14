const paymentController = require("../payment.controller");
const db = require("../../../config/db");

// Mock dependencies
jest.mock("../../../config/db");
jest.mock("../../../utils/asyncHandler", () => (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

jest.mock("stripe", () => {
  const stripeObj = {
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
  const fn = jest.fn().mockReturnValue(stripeObj);
  fn.stripeObj = stripeObj;
  return fn;
});

jest.mock("razorpay", () => {
  const razorpayObj = {
    orders: {
      create: jest.fn(),
    },
  };
  const fn = jest.fn().mockReturnValue(razorpayObj);
  fn.razorpayObj = razorpayObj;
  return fn;
});

jest.mock("crypto", () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn(),
    }),
  }),
}));

const stripeInstance = require("stripe").stripeObj;
const razorpayInstance = require("razorpay").razorpayObj;
const crypto = require("crypto");

describe("paymentController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      protocol: "http",
      get: jest.fn().mockReturnValue("localhost:3000"),
    };
    res = {
      json: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("createStripeSession", () => {
    it("should throw 400 if appointmentId is missing", async () => {
      await paymentController.createStripeSession(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should throw 404 if appointment not found", async () => {
      req.body = { appointmentId: 1 };
      db.query.mockResolvedValue([[]]); // empty rows

      await paymentController.createStripeSession(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    it("should throw 400 if already paid", async () => {
      req.body = { appointmentId: 1 };
      db.query.mockResolvedValue([[{ payment_status: "completed" }]]);

      await paymentController.createStripeSession(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should create session and return url", async () => {
      req.body = { appointmentId: 1 };
      db.query.mockResolvedValue([[{ payment_status: "pending", consultation_fee: 500, doctor_name: "Test", patient_name: "Test Patient" }]]);
      stripeInstance.checkout.sessions.create.mockResolvedValue({ id: "sess_123", url: "http://stripe.com" });

      await paymentController.createStripeSession(req, res, next);

      expect(stripeInstance.checkout.sessions.create).toHaveBeenCalled();
      expect(db.query).toHaveBeenCalledWith("UPDATE appointments SET payment_id = ? WHERE id = ?", ["sess_123", 1]);
      expect(res.json).toHaveBeenCalledWith({ success: true, sessionId: "sess_123", url: "http://stripe.com" });
    });
  });

  describe("createRazorpayOrder", () => {
    it("should create order and return details", async () => {
      req.body = { appointmentId: 1 };
      db.query.mockResolvedValue([[{ payment_status: "pending", consultation_fee: 500, doctor_name: "Test", patient_name: "Test Patient" }]]);
      razorpayInstance.orders.create.mockResolvedValue({ id: "order_123", amount: 50000, currency: "INR" });

      await paymentController.createRazorpayOrder(req, res, next);

      expect(razorpayInstance.orders.create).toHaveBeenCalled();
      expect(db.query).toHaveBeenCalledWith("UPDATE appointments SET payment_id = ? WHERE id = ?", ["order_123", 1]);
      expect(res.json).toHaveBeenCalledWith({ success: true, orderId: "order_123", amount: 50000, currency: "INR" });
    });
  });

  describe("verifyPayment", () => {
    it("should throw 400 if provider is missing", async () => {
      req.body = { appointmentId: 1 };
      await paymentController.verifyPayment(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should verify razorpay payment successfully", async () => {
      req.body = { appointmentId: 1, provider: "razorpay", razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "valid_sig" };
      const mockUpdate = jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("valid_sig") });
      crypto.createHmac.mockReturnValue({ update: mockUpdate });

      await paymentController.verifyPayment(req, res, next);

      expect(db.query).toHaveBeenCalledWith("UPDATE appointments SET payment_status = 'completed' WHERE id = ?", [1]);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Payment verified successfully" });
    });

    it("should fail razorpay verification on invalid signature", async () => {
      req.body = { appointmentId: 1, provider: "razorpay", razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "valid_sig" };
      const mockUpdate = jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("invalid_sig") });
      crypto.createHmac.mockReturnValue({ update: mockUpdate });

      await paymentController.verifyPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should verify stripe payment successfully", async () => {
      req.body = { appointmentId: 1, provider: "stripe", stripe_session_id: "sess_1" };
      stripeInstance.checkout.sessions.retrieve.mockResolvedValue({ payment_status: "paid" });
      db.query.mockResolvedValue([[]]); // to mock the UPDATE

      await paymentController.verifyPayment(req, res, next);

      expect(db.query).toHaveBeenCalledWith("UPDATE appointments SET payment_status = 'completed' WHERE id = ?", [1]);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Payment verified successfully" });
    });
  });

  describe("stripeWebhook", () => {
    it("should return 400 on signature failure", async () => {
      req.headers["stripe-signature"] = "invalid";
      req.body = {};
      stripeInstance.webhooks.constructEvent = jest.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      await paymentController.stripeWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update appointment status on checkout.session.completed", async () => {
      req.headers["stripe-signature"] = "valid";
      req.body = {};
      stripeInstance.webhooks.constructEvent = jest.fn().mockReturnValue({
        type: "checkout.session.completed",
        data: { object: { id: "sess_1" } },
      });

      await paymentController.stripeWebhook(req, res, next);

      expect(db.query).toHaveBeenCalledWith("UPDATE appointments SET payment_status = 'completed' WHERE payment_id = ?", ["sess_1"]);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe("razorpayWebhook", () => {
    it("should return 400 on missing signature", async () => {
      req.headers["x-razorpay-signature"] = null;

      await paymentController.razorpayWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().send).toHaveBeenCalledWith("No signature found");
    });

    it("should return 400 on invalid signature", async () => {
      req.headers["x-razorpay-signature"] = "invalid";
      req.body = {};
      const mockUpdate = jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("different") });
      crypto.createHmac.mockReturnValue({ update: mockUpdate });

      await paymentController.razorpayWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().send).toHaveBeenCalledWith("Invalid signature");
    });

    it("should update appointment status on order.paid", async () => {
      req.headers["x-razorpay-signature"] = "valid";
      req.body = { event: "order.paid", payload: { order: { entity: { id: "order_1" } } } };
      const mockUpdate = jest.fn().mockReturnValue({ digest: jest.fn().mockReturnValue("valid") });
      crypto.createHmac.mockReturnValue({ update: mockUpdate });

      await paymentController.razorpayWebhook(req, res, next);

      expect(db.query).toHaveBeenCalledWith("UPDATE appointments SET payment_status = 'completed' WHERE payment_id = ?", ["order_1"]);
      expect(res.json).toHaveBeenCalledWith({ status: "ok" });
    });
  });
});
