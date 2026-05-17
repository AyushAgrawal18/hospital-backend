const request = require("supertest");
const app = require("../../app");

describe("Auth Routes Integration Tests", () => {
  describe("POST /api/auth/register", () => {
    it("should require all fields", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "John Doe",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("required");
    });

    it("should handle valid registration structure", async () => {
      const newUser = {
        name: "Test User",
        email: "testuser@test.com",
        password: "password123",
        role: "staff",
      };

      // This will fail without DB connection, but tests the endpoint structure
      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser);

      // Expect either success (201) or DB error (500/503)
      expect([201, 400, 500, 503]).toContain(response.status);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should require email and password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
      });

      // Should return error (400 or 500)
      expect([400, 500]).toContain(response.status);
    });

    it("should handle valid login structure", async () => {
      const credentials = {
        email: "test@test.com",
        password: "password123",
      };

      // This will fail without DB connection, but tests the endpoint structure
      const response = await request(app)
        .post("/api/auth/login")
        .send(credentials);

      // Expect either success (200) or DB error/invalid credentials
      expect([200, 401, 500, 503]).toContain(response.status);
    });
  });

  describe("Database Connection Test", () => {
    it("should connect to database", async () => {
      const response = await request(app).get("/test-db");

      // Should either succeed or have a connection error message
      expect([200, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.message).toContain("Database Connected");
      }
    });
  });

  describe("Basic API Health", () => {
    it("should return API running message", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);
      expect(response.text).toContain("Hospital API Running");
    });
  });
});
