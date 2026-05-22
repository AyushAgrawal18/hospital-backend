const { protect, authorize } = require("../authMiddleware");
const jwt = require("jsonwebtoken");
const userModel = require("../../models/userModel");

jest.mock("jsonwebtoken");
jest.mock("../../models/userModel");
jest.mock("../../utils/asyncHandler", () => (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next));

describe("authMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("protect", () => {
    it("should throw 401 if no authorization header", async () => {
      await protect(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toBe("Not authorized");
    });

    it("should throw 401 if token is not valid", async () => {
      req.headers.authorization = "Bearer token123";
      jwt.verify.mockImplementation(() => { throw new Error("Invalid token"); });

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should throw 401 if user is not found", async () => {
      req.headers.authorization = "Bearer token123";
      jwt.verify.mockReturnValue({ id: 1 });
      userModel.findById.mockResolvedValue(null);

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toBe("User not found");
    });

    it("should attach user to req and call next", async () => {
      req.headers.authorization = "Bearer token123";
      jwt.verify.mockReturnValue({ id: 1 });
      const mockUser = { id: 1, name: "Test" };
      userModel.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // Called without errors
    });
  });

  describe("authorize", () => {
    it("should throw 403 if user role is not allowed", () => {
      req.user = { role: "patient" };
      const middleware = authorize("admin", "staff");

      expect(() => {
        middleware(req, res, next);
      }).toThrow(expect.objectContaining({ message: "Access denied", statusCode: 403 }));
    });

    it("should call next if user role is allowed", () => {
      req.user = { role: "admin" };
      const middleware = authorize("admin", "staff");

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
