const db = require("../config/db");

exports.createDoctor = async (req, res) => {
  try {
    const { name, specialization, experience } = req.body;

    const [result] = await db.query(
      "INSERT INTO doctors (name, specialization, experience) VALUES (?, ?, ?)",
      [name, specialization, experience],
    );

    res.status(201).json({
      message: "Doctor created",
      doctorId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM doctors");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT * FROM doctors WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialization, experience } = req.body;

    const [result] = await db.query(
      "UPDATE doctors SET name = ?, specialization = ?, experience = ? WHERE id = ?",
      [name, specialization, experience, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!name || !specialization || !experience) {
      return res.status(400).json({ message: "All fields required" });
    }

    res.json({ message: "Doctor updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM doctors WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
