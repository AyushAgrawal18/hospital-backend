const doctorModel = require("../doctor.model");
const db = require("../../../config/db");

jest.mock("../../../config/db");

describe("doctorModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should execute SELECT query with pagination and return rows", async () => {
      const mockRows = [{ id: 1 }, { id: 2 }];
      db.query.mockResolvedValue([mockRows]);

      const result = await doctorModel.findAll("FROM doctors WHERE 1=1", [], 10, 0);

      expect(db.query).toHaveBeenCalledWith("SELECT * FROM doctors WHERE 1=1 LIMIT ? OFFSET ?", [10, 0]);
      expect(result).toEqual(mockRows);
    });
  });

  describe("countAll", () => {
    it("should execute SELECT COUNT query and return count", async () => {
      db.query.mockResolvedValue([[{ count: 5 }]]);

      const result = await doctorModel.countAll("FROM doctors WHERE 1=1", []);

      expect(db.query).toHaveBeenCalledWith("SELECT COUNT(*) as count FROM doctors WHERE 1=1", []);
      expect(result).toBe(5);
    });
  });

  describe("findById", () => {
    it("should execute SELECT query and return doctor", async () => {
      db.query.mockResolvedValue([[{ id: 1, name: "Test" }]]);

      const result = await doctorModel.findById(1);

      expect(db.query).toHaveBeenCalledWith("SELECT * FROM doctors WHERE id = ?", [1]);
      expect(result).toEqual({ id: 1, name: "Test" });
    });
  });

  describe("create", () => {
    it("should execute INSERT query and return insertId", async () => {
      db.query.mockResolvedValue([{ insertId: 10 }]);

      const result = await doctorModel.create("Test", "Cardio", 5, "path.jpg", 500);

      expect(db.query).toHaveBeenCalledWith(
        "INSERT INTO doctors (name, specialization, experience, photo, consultation_fee) VALUES (?, ?, ?, ?, ?)",
        ["Test", "Cardio", 5, "path.jpg", 500]
      );
      expect(result).toBe(10);
    });
  });

  describe("update", () => {
    it("should execute UPDATE query and return affectedRows", async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await doctorModel.update(1, "Test", "Cardio", 5, "path.jpg", 600);

      expect(db.query).toHaveBeenCalledWith(
        "UPDATE doctors SET name = ?, specialization = ?, experience = ?, photo = COALESCE(?, photo), consultation_fee = ? WHERE id = ?",
        ["Test", "Cardio", 5, "path.jpg", 600, 1]
      );
      expect(result).toBe(1);
    });
  });

  describe("remove", () => {
    it("should execute DELETE query and return affectedRows", async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await doctorModel.remove(1);

      expect(db.query).toHaveBeenCalledWith("DELETE FROM doctors WHERE id = ?", [1]);
      expect(result).toBe(1);
    });
  });

  describe("findByUserId", () => {
    it("should execute SELECT query and return doctor", async () => {
      db.query.mockResolvedValue([[{ id: 1, user_id: 2 }]]);

      const result = await doctorModel.findByUserId(2);

      expect(db.query).toHaveBeenCalledWith("SELECT * FROM doctors WHERE user_id = ?", [2]);
      expect(result).toEqual({ id: 1, user_id: 2 });
    });
  });
});
