const patientModel = require("../patient.model");

jest.mock("../../../config/db");
describe("patientModel", () => {
  describe("create", () => {
    it("should execute INSERT query using provided connection and return insertId", async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValue([{ insertId: 7 }])
      };

      const result = await patientModel.create(mockConnection, "John", "j@test.com", "123", 10);

      expect(mockConnection.query).toHaveBeenCalledWith(
        "INSERT INTO patients (name, email, phone, user_id) VALUES (?, ?, ?, ?)",
        ["John", "j@test.com", "123", 10]
      );
      expect(result).toBe(7);
    });
  });

  describe("findAll", () => {
    it("should execute SELECT query and return rows", async () => {
      const mockDb = require("../../../config/db");
      mockDb.query = jest.fn().mockResolvedValue([[{ id: 1 }, { id: 2 }]]);
      
      const result = await patientModel.findAll();
      
      expect(mockDb.query).toHaveBeenCalledWith("SELECT * FROM patients");
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe("findById", () => {
    it("should execute SELECT query and return patient", async () => {
      const mockDb = require("../../../config/db");
      mockDb.query = jest.fn().mockResolvedValue([[{ id: 1, name: "Test" }]]);
      
      const result = await patientModel.findById(1);
      
      expect(mockDb.query).toHaveBeenCalledWith("SELECT * FROM patients WHERE id = ?", [1]);
      expect(result).toEqual({ id: 1, name: "Test" });
    });
  });

  describe("findByUserId", () => {
    it("should execute SELECT query and return patient", async () => {
      const mockDb = require("../../../config/db");
      mockDb.query = jest.fn().mockResolvedValue([[{ id: 1, user_id: 10 }]]);
      
      const result = await patientModel.findByUserId(10);
      
      expect(mockDb.query).toHaveBeenCalledWith("SELECT * FROM patients WHERE user_id = ?", [10]);
      expect(result).toEqual({ id: 1, user_id: 10 });
    });
  });

  describe("update", () => {
    it("should execute UPDATE query and return affectedRows", async () => {
      const mockDb = require("../../../config/db");
      mockDb.query = jest.fn().mockResolvedValue([{ affectedRows: 1 }]);
      
      const result = await patientModel.update(1, "Updated", "u@test.com", "456");
      
      expect(mockDb.query).toHaveBeenCalledWith(
        "UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?",
        ["Updated", "u@test.com", "456", 1]
      );
      expect(result).toBe(1);
    });
  });
});
