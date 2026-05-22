require("dotenv").config();
const db = require("./src/config/db");

const migrate = async () => {
  console.log("Starting database migration...");

  try {
    console.log("Adding consultation_fee to doctors table...");
    await db.query(`
      ALTER TABLE doctors 
      ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT 0
    `);
    console.log("Added consultation_fee column successfully.");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column consultation_fee already exists. Skipping.");
    } else {
      console.error("Error adding consultation_fee:", err.message);
    }
  }

  try {
    console.log("Adding payment_status to appointments table...");
    await db.query(`
      ALTER TABLE appointments 
      ADD COLUMN payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending'
    `);
    console.log("Added payment_status column successfully.");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column payment_status already exists. Skipping.");
    } else {
      console.error("Error adding payment_status:", err.message);
    }
  }

  try {
    console.log("Adding payment_id to appointments table...");
    await db.query(`
      ALTER TABLE appointments 
      ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL
    `);
    console.log("Added payment_id column successfully.");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column payment_id already exists. Skipping.");
    } else {
      console.error("Error adding payment_id:", err.message);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
};

migrate();
