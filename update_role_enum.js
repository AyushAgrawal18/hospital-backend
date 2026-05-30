require("dotenv").config();
const db = require("./src/config/db");

async function updateSchema() {
  try {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin','doctor','staff','patient') DEFAULT 'patient';");
    console.log("Schema updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateSchema();
