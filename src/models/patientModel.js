const db = require('../config/db');

exports.create = async (connection, name, email, phone) => {
  const [result] = await connection.query(
    "INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)",
    [name, email, phone]
  );
  return result.insertId;
};