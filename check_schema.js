require("dotenv").config();
const db = require("./src/config/db");

async function checkSchema() {
  try {
    const [rows] = await db.query("DESCRIBE users;");
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
