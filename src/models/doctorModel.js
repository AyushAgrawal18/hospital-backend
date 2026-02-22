const db = require("../config/db");

exports.findAll = async (baseQuery, values, limit, offset) => {
  const [rows] = await db.query(`SELECT * ${baseQuery} LIMIT ? OFFSET ?`, [
    ...values,
    limit,
    offset,
  ]);

  return rows;
};

exports.countAll = async (baseQuery, values) => {
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count ${baseQuery}`,
    values,
  );

  return count;
};

exports.findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM doctors WHERE id = ?", [id]);

  return rows[0];
};

exports.create = async (name, specialization, experience, photoPath) => {
  const [result] = await db.query(
    "INSERT INTO doctors (name, specialization, experience, photo) VALUES (?, ?, ?, ?)",
    [name, specialization, experience, photoPath],
  );

  return result.insertId;
};

exports.update = async (id, name, specialization, experience, photoPath) => {
  const [result] = await db.query(
    "UPDATE doctors SET name = ?, specialization = ?, experience = ?, photo = COALESCE(?, photo) WHERE id = ?",
    [name, specialization, experience, photoPath, id],
  );

  return result.affectedRows;
};

exports.remove = async (id) => {
  const [result] = await db.query("DELETE FROM doctors WHERE id = ?", [id]);

  return result.affectedRows;
};
