const db = require("../config/db");

const asyncHandler = require("../utils/asyncHandler");

exports.createDoctor = asyncHandler(async (req, res, next) => {
  // try {
  const { name, specialization, experience } = req.body;

  if (!name || !specialization || experience===null) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  if(typeof experience !== "number" || experience < 0) {
    const error = new Error("Experience must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }



  const [result] = await db.query(
    "INSERT INTO doctors (name, specialization, experience) VALUES (?, ?, ?)",
    [name, specialization, experience],
  );

  res.status(201).json({
    message: "Doctor created",
    doctorId: result.insertId,
  });
  // } catch (error) {
  //   // res.status(500).json({ error: error.message });
  //   next(error);
  // }
});

// exports.getDoctors = asyncHandler(async (req, res, next) => {
//   // try {
//   const [rows] = await db.query("SELECT * FROM doctors");
//   res.json(rows);
//   // } catch (error) {
//   //   // res.status(500).json({ error: error.message });
//   //   next(error);
//   // }
// });

exports.getDoctors = asyncHandler(async (req, res) => {
    let { page = 1, limit = 5, specialization, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    let baseQuery = "FROM doctors WHERE 1=1";
    let values = [];

    if (specialization) {
        baseQuery += " AND specialization = ?";
        values.push(specialization);
    }

    if (search) {
        baseQuery += " AND name LIKE ?";
        values.push(`%${search}%`);
    }

    const [rows] = await db.query(
        `SELECT * ${baseQuery} LIMIT ? OFFSET ?`,
        [...values, limit, offset]
    );

    const [[{ count }]] = await db.query(
        `SELECT COUNT(*) as count ${baseQuery}`,
        values
    );

    res.json({
        success: true,
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        data: rows
    });
});



exports.getDoctorById = asyncHandler(async (req, res, next) => {
  // try {
  const { id } = req.params;

  const [rows] = await db.query("SELECT * FROM doctors WHERE id = ?", [id]);

  if (rows.length === 0) {
    // return res.status(404).json({ message: "Doctor not found" });
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    doctor: rows[0],
  });
  // } catch (error) {
  //   // res.status(500).json({ error: error.message });
  //   next(error);
  // }
});



exports.updateDoctor = asyncHandler(async (req, res, next) => {
  // try {
  const { id } = req.params;
  const { name, specialization, experience } = req.body;

  const [result] = await db.query(
    "UPDATE doctors SET name = ?, specialization = ?, experience = ? WHERE id = ?",
    [name, specialization, experience, id],
  );

  if (result.affectedRows === 0) {
    // return res.status(404).json({ message: "Doctor not found" });
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    throw error;
  }

  if (!name || !specialization || !experience) {
    // return res.status(400).json({ message: "All fields required" });
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  res.json({ success: true, message: "Doctor updated" });
  // } catch (error) {
  //   // res.status(500).json({ error: error.message });
  //   next(error);
  // }
});

exports.deleteDoctor = asyncHandler(async (req, res, next) => {
  // try {
  const { id } = req.params;

  const [result] = await db.query("DELETE FROM doctors WHERE id = ?", [id]);

  if (result.affectedRows === 0) {
    // return res.status(404).json({ message: "Doctor not found" });
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, message: "Doctor deleted" });
  // }
  //  catch (error) {
  //   // res.status(500).json({ error: error.message });
  //   next(error);
  // }
});
