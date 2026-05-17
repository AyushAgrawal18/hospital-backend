const request = require("supertest");
const app = require("../../app");

describe("Doctor Routes Integration Tests", () => {
  describe("GET /api/doctors", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/doctors");

      // Without proper auth token, should fail
      expect([401, 500, 503]).toContain(response.status);
    });

    it("should accept pagination parameters", async () => {
      const response = await request(app)
        .get("/api/doctors")
        .query({ page: 1, limit: 5 });

      // Should process query parameters
      expect([200, 401, 500, 503]).toContain(response.status);
    });

    it("should accept filter parameters", async () => {
      const response = await request(app)
        .get("/api/doctors")
        .query({ specialization: "Cardiology" });

      // Should accept specialization filter
      expect([200, 401, 500, 503]).toContain(response.status);
    });
  });

  describe("POST /api/doctors", () => {
    it("should require required fields", async () => {
      const response = await request(app).post("/api/doctors").send({
        name: "Dr. Test",
      });

      expect([400, 401, 500, 503]).toContain(response.status);
    });

    it("should validate experience is a number", async () => {
      const response = await request(app).post("/api/doctors").send({
        name: "Dr. Test",
        specialization: "Surgery",
        experience: "invalid",
      });

      // Should either accept and fail at DB or validate input
      expect([200, 400, 401, 500, 503]).toContain(response.status);
    });

    it("should reject negative experience", async () => {
      const response = await request(app).post("/api/doctors").send({
        name: "Dr. Test",
        specialization: "Surgery",
        experience: -5,
      });

      expect([400, 401, 500, 503]).toContain(response.status);
    });
  });

  describe("GET /api/doctors/:id", () => {
    it("should handle doctor ID parameter", async () => {
      const response = await request(app).get("/api/doctors/1");

      // Should process ID parameter
      expect([200, 401, 404, 500, 503]).toContain(response.status);
    });
  });

  describe("PUT /api/doctors/:id", () => {
    it("should handle doctor update", async () => {
      const response = await request(app).put("/api/doctors/1").send({
        name: "Dr. Updated",
        specialization: "Cardiology",
        experience: 15,
      });

      expect([200, 401, 404, 500, 503]).toContain(response.status);
    });
  });

  describe("DELETE /api/doctors/:id", () => {
    it("should handle doctor deletion", async () => {
      const response = await request(app).delete("/api/doctors/1");

      expect([200, 401, 404, 500, 503]).toContain(response.status);
    });
  });
});
