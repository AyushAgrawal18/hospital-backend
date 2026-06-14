const patientController = require("../patient.controller");
const patientModel = require("../patient.model");
const db = require("../../../config/db");

jest.mock("../patient.model");
jest.mock("../../../config/db");
jest.mock("../../../utils/asyncHandler", () => (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

describe("patientController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getAllPatients", () => {
    it("should return all patients", async () => {
      patientModel.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await patientController.getAllPatients(req, res, next);

      expect(patientModel.findAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 2, data: [{ id: 1 }, { id: 2 }] });
    });
  });

  describe("getPatientProfile", () => {
    it("should return 404 if patient not found", async () => {
      req.user.id = 1;
      patientModel.findByUserId.mockResolvedValue(null);

      await patientController.getPatientProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Patient profile not found" });
    });

    it("should return patient data", async () => {
      req.user.id = 1;
      patientModel.findByUserId.mockResolvedValue({ id: 10, user_id: 1 });

      await patientController.getPatientProfile(req, res, next);

      expect(patientModel.findByUserId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 10, user_id: 1 } });
    });
  });

  describe("updatePatientProfile", () => {
    it("should throw 400 if required fields are missing", async () => {
      req.body = { name: "Test" };
      
      await patientController.updatePatientProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should create patient if it does not exist", async () => {
      req.user.id = 1;
      req.body = { name: "Test", email: "t@test.com", phone: "123" };
      patientModel.findByUserId.mockResolvedValue(null);
      
      const connection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };
      db.getConnection.mockResolvedValue(connection);
      patientModel.create.mockResolvedValue(10);

      await patientController.updatePatientProfile(req, res, next);

      expect(db.getConnection).toHaveBeenCalled();
      expect(connection.beginTransaction).toHaveBeenCalled();
      expect(patientModel.create).toHaveBeenCalledWith(connection, "Test", "t@test.com", "123", 1);
      expect(connection.commit).toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Patient profile created", patientId: 10 });
    });

    it("should update patient if it exists", async () => {
      req.user.id = 1;
      req.body = { name: "Updated", email: "u@test.com", phone: "456" };
      patientModel.findByUserId.mockResolvedValue({ id: 10 });
      patientModel.update.mockResolvedValue(1);

      await patientController.updatePatientProfile(req, res, next);

      expect(patientModel.update).toHaveBeenCalledWith(10, "Updated", "u@test.com", "456");
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Patient profile updated" });
    });
  });
});
