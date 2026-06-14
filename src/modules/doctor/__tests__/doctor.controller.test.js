const doctorController = require("../doctor.controller");
const doctorModel = require("../doctor.model");
const db = require("../../../config/db");

jest.mock("../doctor.model");
jest.mock("../../../config/db");
jest.mock("../../../utils/asyncHandler", () => (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

describe("doctorController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      file: null,
      protocol: "http",
      get: jest.fn().mockReturnValue("localhost:3000"),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("createDoctor", () => {
    it("should throw 400 if required fields are missing", async () => {
      req.body = { name: "Dr. Test" }; // missing specialization and experience

      await doctorController.createDoctor(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe("All fields are required");
    });

    it("should throw 400 if experience is invalid", async () => {
      req.body = { name: "Dr. Test", specialization: "Cardio", experience: -5, consultation_fee: 500 };

      await doctorController.createDoctor(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe("Experience must be a non-negative number");
    });

    it("should create doctor and return 201", async () => {
      req.body = { name: "Dr. Test", specialization: "Cardio", experience: 5, consultation_fee: 500 };
      req.file = { path: "uploads/test.jpg" };
      doctorModel.create.mockResolvedValue(10);

      await doctorController.createDoctor(req, res, next);

      expect(doctorModel.create).toHaveBeenCalledWith("Dr. Test", "Cardio", 5, "uploads/test.jpg", 500);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Doctor created", doctorId: 10 });
    });
  });

  describe("getDoctors", () => {
    it("should fetch doctors and return paginated data with photoUrl", async () => {
      req.query = { page: 1, limit: 10, specialization: "Cardio", search: "Test" };
      const mockDoctors = [{ id: 1, name: "Dr. Test", photo: "uploads\\test.jpg" }, { id: 2, photo: null }];
      doctorModel.findAll.mockResolvedValue(mockDoctors);
      doctorModel.countAll.mockResolvedValue(2);

      await doctorController.getDoctors(req, res, next);

      expect(doctorModel.findAll).toHaveBeenCalled();
      expect(doctorModel.countAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        page: 1,
        limit: 10,
        total: 2,
        data: [
          { id: 1, name: "Dr. Test", photo: "uploads\\test.jpg", photoUrl: "http://localhost:3000/uploads/test.jpg" },
          { id: 2, photo: null, photoUrl: null }
        ]
      }));
    });
  });

  describe("getDoctorById", () => {
    it("should throw 404 if doctor not found", async () => {
      req.params = { id: 1 };
      doctorModel.findById.mockResolvedValue(null);

      await doctorController.getDoctorById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    it("should fetch doctor and return photoUrl", async () => {
      req.params = { id: 1 };
      doctorModel.findById.mockResolvedValue({ id: 1, photo: "uploads\\test.jpg" });

      await doctorController.getDoctorById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ photoUrl: "http://localhost:3000/uploads/test.jpg" })
      }));
    });
  });

  describe("updateDoctor", () => {
    it("should throw 400 if fields are missing", async () => {
      req.params = { id: 1 };
      req.body = { name: "Test" };

      await doctorController.updateDoctor(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should throw 404 if doctor to update is not found", async () => {
      req.params = { id: 1 };
      req.body = { name: "Test", specialization: "Cardio", experience: 10, consultation_fee: 500 };
      doctorModel.update.mockResolvedValue(0);

      await doctorController.updateDoctor(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    it("should update doctor and return success", async () => {
      req.params = { id: 1 };
      req.body = { name: "Test", specialization: "Cardio", experience: 10, consultation_fee: 600 };
      req.file = { filename: "test.jpg" };
      doctorModel.update.mockResolvedValue(1);

      await doctorController.updateDoctor(req, res, next);

      expect(doctorModel.update).toHaveBeenCalledWith(1, "Test", "Cardio", 10, "uploads/doctors/test.jpg", 600);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Doctor updated" });
    });
  });

  describe("deleteDoctor", () => {
    it("should throw 404 if doctor to delete is not found", async () => {
      req.params = { id: 1 };
      doctorModel.remove.mockResolvedValue(0);

      await doctorController.deleteDoctor(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    it("should delete doctor and return success", async () => {
      req.params = { id: 1 };
      doctorModel.remove.mockResolvedValue(1);

      await doctorController.deleteDoctor(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Doctor deleted" });
    });
  });
});
