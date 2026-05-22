const patientModel = require("../patientModel");

describe("patientModel", () => {
  describe("create", () => {
    it("should execute INSERT query using provided connection and return insertId", async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValue([{ insertId: 7 }])
      };

      const result = await patientModel.create(mockConnection, "John", "j@test.com", "123");

      expect(mockConnection.query).toHaveBeenCalledWith(
        "INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)",
        ["John", "j@test.com", "123"]
      );
      expect(result).toBe(7);
    });
  });
});
