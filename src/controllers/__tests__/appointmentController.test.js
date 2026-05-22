const appointmentController = require("../appointmentController");
const db = require("../../config/db");
const patientModel = require("../../models/patientModel");
const appointmentModel = require("../../models/appointmentModel");
const doctorModel = require("../../models/doctorModel");

jest.mock("../../config/db");
jest.mock("../../models/patientModel");
jest.mock("../../models/appointmentModel");
jest.mock("../../models/doctorModel");
jest.mock("../../utils/asyncHandler", () => (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

describe("appointmentController", () => {
  let req, res, next, connection;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    db.getConnection.mockResolvedValue(connection);
    jest.clearAllMocks();
  });

  describe("bookAppointment", () => {
    it("should throw 400 error if required fields are missing", async () => {
      req.body = { doctorId: 1 }; 
      await appointmentController.bookAppointment(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe("Required fields missing");
    });

    it("should book an appointment and commit transaction", async () => {
      req.body = { doctorId: 1, name: "Test Patient", email: "p@test.com", phone: "123", appointmentTime: "2023-10-10" };
      patientModel.create.mockResolvedValue(100);
      appointmentModel.create.mockResolvedValue(200);

      await appointmentController.bookAppointment(req, res, next);

      expect(connection.beginTransaction).toHaveBeenCalled();
      expect(patientModel.create).toHaveBeenCalledWith(connection, "Test Patient", "p@test.com", "123");
      expect(appointmentModel.create).toHaveBeenCalledWith(connection, 1, 100, "2023-10-10");
      expect(connection.commit).toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Appointment booked", appointmentId: 200 });
    });

    it("should rollback transaction on duplicate entry error", async () => {
      req.body = { doctorId: 1, name: "Test Patient", email: "p@test.com", phone: "123", appointmentTime: "2023-10-10" };
      const duplicateError = new Error("Duplicate");
      duplicateError.code = "ER_DUP_ENTRY";
      patientModel.create.mockRejectedValue(duplicateError);

      await appointmentController.bookAppointment(req, res, next);

      expect(connection.rollback).toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "This time slot is already booked" });
    });
  });

  describe("updateAppointmentStatus", () => {
    it("should reject invalid status values", async () => {
      req.params = { id: 1 };
      req.body = { status: "invalid_status" };

      await appointmentController.updateAppointmentStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Invalid status value" }));
    });

    it("should return 404 if appointment not found", async () => {
      req.params = { id: 1 };
      req.body = { status: "completed" };
      db.query.mockResolvedValue([[]]); // empty rows

      await appointmentController.updateAppointmentStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Appointment not found" }));
    });

    it("should prevent modifying completed or cancelled appointments", async () => {
      req.params = { id: 1 };
      req.body = { status: "completed" };
      db.query.mockResolvedValue([[{ status: "cancelled" }]]);

      await appointmentController.updateAppointmentStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Cannot modify completed or cancelled appointment" }));
    });

    it("should update appointment status", async () => {
      req.params = { id: 1 };
      req.body = { status: "completed" };
      db.query.mockResolvedValueOnce([[{ status: "booked" }]]); // select
      db.query.mockResolvedValueOnce([{}]); // update

      await appointmentController.updateAppointmentStatus(req, res, next);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Appointment status updated" }));
    });
  });

  describe("getMyAppointments", () => {
    it("should return all appointments for admin", async () => {
      req.user = { role: "admin" };
      db.query.mockResolvedValue([[{ id: 1 }]]);

      await appointmentController.getMyAppointments(req, res, next);

      expect(db.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
    });

    it("should return 404 if doctor profile not found for doctor role", async () => {
      req.user = { role: "doctor", id: 10 };
      doctorModel.findByUserId.mockResolvedValue(null);

      await appointmentController.getMyAppointments(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Doctor profile not found" }));
    });

    it("should return doctor appointments for doctor role", async () => {
      req.user = { role: "doctor", id: 10 };
      doctorModel.findByUserId.mockResolvedValue({ id: 5 });
      appointmentModel.findAppointmentsByDoctorId.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await appointmentController.getMyAppointments(req, res, next);

      expect(appointmentModel.findAppointmentsByDoctorId).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 2 }));
    });

    it("should return 403 for unauthorized roles", async () => {
      req.user = { role: "patient" };

      await appointmentController.getMyAppointments(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
