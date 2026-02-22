const db = require("../config/db");

const asyncHandler = require("../utils/asyncHandler");

exports.createDoctor = asyncHandler(async (req, res, next) => {
  // try {
  const { name, specialization, experience } = req.body;

  if (!name || !specialization || experience === null) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  const experienceNumber = Number(experience);

  if (isNaN(experienceNumber) || experienceNumber < 0) {
    const error = new Error("Experience must be a non-negative number");
    error.statusCode = 400;
    throw error;
  }

  const photoPath = req.file ? req.file.path : null;

  const [result] = await db.query(
    "INSERT INTO doctors (name, specialization, experience, photo) VALUES (?, ?, ?, ?)",
    [name, specialization, experience, photoPath],
  );

  res.status(201).json({
    success: true,
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

  const [rows] = await db.query(`SELECT * ${baseQuery} LIMIT ? OFFSET ?`, [
    ...values,
    limit,
    offset,
  ]);

  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) as count ${baseQuery}`,
    values,
  );

  const updatedRows = rows.map((doctor) => {
    let photoUrl = null;

    if (doctor.photo) {
      const normalizedPath = doctor.photo.replace(/\\/g, "/");

      photoUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;
    }

    return {
      ...doctor,
      photoUrl,
    };
  });

  res.json({
    success: true,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
    data: updatedRows,
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

  const doctor = rows[0];

  if (doctor.photo) {
    const normalizedPath = doctor.photo.replace(/\\/g, "/");
    doctor.photoUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;
  } else {
    doctor.photoUrl = null;
  }

  res.json({
    success: true,
    data: doctor,
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
