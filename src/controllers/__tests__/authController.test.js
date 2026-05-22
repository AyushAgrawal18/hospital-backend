const authController = require("../authController");
const userModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Mock the dependencies
jest.mock("../../models/userModel");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../utils/asyncHandler", () => (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

describe("authController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    process.env.JWT_SECRET = "testsecret";
  });

  describe("register", () => {
    it("should throw 400 error if required fields are missing", async () => {
      req.body = { name: "Test" }; // missing email and password

      await authController.register(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe("All fields are required");
    });

    it("should throw 400 error if email is already registered", async () => {
      req.body = { name: "Test", email: "test@test.com", password: "password123" };
      userModel.findByEmail.mockResolvedValue({ id: 1, email: "test@test.com" });

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe("Email already registered");
    });

    it("should register user and return token on success", async () => {
      req.body = { name: "Test", email: "test@test.com", password: "password123", role: "admin" };
      userModel.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      userModel.create.mockResolvedValue(1); // userId = 1
      jwt.sign.mockReturnValue("testToken");

      await authController.register(req, res, next);

      expect(userModel.create).toHaveBeenCalledWith("Test", "test@test.com", "hashedPassword", "admin");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User registered",
        token: "testToken",
      });
    });
  });

  describe("login", () => {
    it("should throw 401 error if user is not found", async () => {
      req.body = { email: "wrong@test.com", password: "password123" };
      userModel.findByEmail.mockResolvedValue(null);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toBe("Invalid credentials");
    });

    it("should throw 401 error if password does not match", async () => {
      req.body = { email: "test@test.com", password: "wrongpassword" };
      userModel.findByEmail.mockResolvedValue({ id: 1, password: "hashedPassword" });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toBe("Invalid credentials");
    });

    it("should return token on successful login", async () => {
      req.body = { email: "test@test.com", password: "password123" };
      userModel.findByEmail.mockResolvedValue({ id: 1, password: "hashedPassword" });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("testToken");

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        token: "testToken",
      });
    });
  });
});
