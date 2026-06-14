const appointmentModel = require("../appointment.model");
const db = require("../../../config/db");

jest.mock("../../../config/db");

describe("appointmentModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should execute INSERT query using provided connection and return insertId", async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValue([{ insertId: 5 }])
      };

      const result = await appointmentModel.create(mockConnection, 1, 2, "2023-10-10");

      expect(mockConnection.query).toHaveBeenCalledWith(
        "INSERT INTO appointments (doctor_id, patient_id, appointment_time) VALUES (?, ?, ?)",
        [1, 2, "2023-10-10"]
      );
      expect(result).toBe(5);
    });
  });

  describe("findAppointmentsByDoctorId", () => {
    it("should execute SELECT query with JOINs and return rows", async () => {
      const mockRows = [{ id: 1, doctor_name: "Test" }];
      db.query.mockResolvedValue([mockRows]);

      const result = await appointmentModel.findAppointmentsByDoctorId(10);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("JOIN patients"),
        [10]
      );
      expect(result).toEqual(mockRows);
    });
  });
});
