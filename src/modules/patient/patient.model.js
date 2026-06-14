const db = require("../../config/db");

exports.create = async (connection, name, email, phone, userId = null) => {
  const [result] = await connection.query(
    "INSERT INTO patients (name, email, phone, user_id) VALUES (?, ?, ?, ?)",
    [name, email, phone, userId]
  );
  return result.insertId;
};

exports.findAll = async () => {
  const [rows] = await db.query("SELECT * FROM patients");
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM patients WHERE id = ?", [id]);
  return rows[0];
};

exports.findByUserId = async (userId) => {
  const [rows] = await db.query("SELECT * FROM patients WHERE user_id = ?", [userId]);
  return rows[0];
};

exports.update = async (id, name, email, phone) => {
  const [result] = await db.query(
    "UPDATE patients SET name = ?, email = ?, phone = ? WHERE id = ?",
    [name, email, phone, id]
  );
  return result.affectedRows;
};