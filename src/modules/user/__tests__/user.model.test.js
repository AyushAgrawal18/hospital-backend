const userModel = require("../user.model");
const db = require("../../../config/db");

jest.mock("../../../config/db");

describe("userModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("should return the user if found", async () => {
      const mockUser = { id: 1, email: "test@test.com" };
      db.query.mockResolvedValue([[mockUser]]);

      const result = await userModel.findByEmail("test@test.com");

      expect(db.query).toHaveBeenCalledWith("SELECT * FROM users WHERE email = ?", ["test@test.com"]);
      expect(result).toEqual(mockUser);
    });

    it("should return undefined if user not found", async () => {
      db.query.mockResolvedValue([[]]);

      const result = await userModel.findByEmail("notfound@test.com");

      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should insert user and return insertId", async () => {
      db.query.mockResolvedValue([{ insertId: 5 }]);

      const result = await userModel.create("Test", "test@test.com", "hash", "staff");

      expect(db.query).toHaveBeenCalledWith(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Test", "test@test.com", "hash", "staff"]
      );
      expect(result).toBe(5);
    });
  });

  describe("findById", () => {
    it("should return user without password if found", async () => {
      const mockUser = { id: 1, name: "Test", email: "test@test.com", role: "admin" };
      db.query.mockResolvedValue([[mockUser]]);

      const result = await userModel.findById(1);

      expect(db.query).toHaveBeenCalledWith(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [1]
      );
      expect(result).toEqual(mockUser);
    });
  });
});
