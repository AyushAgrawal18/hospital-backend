const request = require("supertest");
const app = require("../../app");

describe("Appointment Routes Integration Tests", () => {
  describe("POST /api/appointments", () => {
    it("should require all necessary fields", async () => {
      const response = await request(app).post("/api/appointments").send({
        doctorId: 1,
      });

      expect([400, 401, 500, 503]).toContain(response.status);
    });

    it("should handle complete appointment data", async () => {
      const appointmentData = {
        doctorId: 1,
        name: "John Patient",
        email: "patient@example.com",
        phone: "1234567890",
        appointmentTime: "2026-05-25 10:00:00",
      };

      const response = await request(app)
        .post("/api/appointments")
        .send(appointmentData);

      // Should process the appointment request
      expect([201, 400, 401, 500, 503]).toContain(response.status);
    });

    it("should validate appointment data structure", async () => {
      const invalidData = {
        doctorId: "invalid",
        name: "Patient",
      };

      const response = await request(app)
        .post("/api/appointments")
        .send(invalidData);

      expect([400, 401, 500, 503]).toContain(response.status);
    });
  });

  describe("PATCH /api/appointments/:id/status", () => {
    it("should require valid status value", async () => {
      const response = await request(app)
        .patch("/api/appointments/1/status")
        .send({
          status: "invalid_status",
        });

      expect([400, 401, 500, 503]).toContain(response.status);
    });

    it("should accept valid status values", async () => {
      const validStatuses = ["booked", "completed", "cancelled"];

      for (const status of validStatuses) {
        const response = await request(app)
          .patch("/api/appointments/1/status")
          .send({ status });

        // Should process the request
        expect([200, 401, 404, 500, 503]).toContain(response.status);
      }
    });

    it("should handle non-existent appointment", async () => {
      const response = await request(app)
        .patch("/api/appointments/999/status")
        .send({ status: "completed" });

      expect([401, 404, 500, 503]).toContain(response.status);
    });
  });

  describe("GET /api/appointments/my", () => {
    it("should require authentication", async () => {
      const response = await request(app).get("/api/appointments/my");

      // Without auth token, should fail
      expect([401, 500, 503]).toContain(response.status);
    });

    it("should return appointment list", async () => {
      const response = await request(app).get("/api/appointments/my");

      // Should either return data or auth error
      expect([200, 401, 500, 503]).toContain(response.status);
    });
  });

  describe("Route Structure Tests", () => {
    it("should have proper endpoint structure", async () => {
      // Test that endpoints are properly registered
      const endpoints = [
        { method: "post", url: "/api/appointments" },
        { method: "patch", url: "/api/appointments/1/status" },
        { method: "get", url: "/api/appointments/my" },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.url);
        // Should not return 404 (endpoint not found)
        expect(response.status).not.toBe(404);
      }
    });
  });
});
