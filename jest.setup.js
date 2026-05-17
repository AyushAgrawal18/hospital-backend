// Setup file for Jest configuration
process.env.JWT_SECRET = "test-secret";
process.env.DB_HOST = "localhost";
process.env.DB_USER = "root";
process.env.DB_PASSWORD = "password";
process.env.DB_NAME = "hospital_test";

module.exports = {
  preset: "node",
};
