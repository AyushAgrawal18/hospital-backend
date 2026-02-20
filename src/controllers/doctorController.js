const db = require('../config/db');

exports.createDoctor = async (req, res) => {
    try {
        const { name, specialization, experience } = req.body;

        const [result] = await db.query(
            "INSERT INTO doctors (name, specialization, experience) VALUES (?, ?, ?)",
            [name, specialization, experience]
        );

        res.status(201).json({
            message: "Doctor created",
            doctorId: result.insertId
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