const doctorModel = require("./doctor.model");
const db = require("../../config/db");

const asyncHandler = require("../../utils/asyncHandler");

exports.createDoctor = asyncHandler(async (req, res, next) => {
  // try {
  const { name, specialization, experience, consultation_fee } = req.body;

  if (!name || !specialization || experience === null || consultation_fee === undefined) {
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

  // const [result] = await db.query(
  //   "INSERT INTO doctors (name, specialization, experience, photo) VALUES (?, ?, ?, ?)",
  //   [name, specialization, experience, photoPath],
  // );

  // res.status(201).json({
  //   success: true,
  //   message: "Doctor created",
  //   doctorId: result.insertId,
  // });
  const insertId = await doctorModel.create(
    name,
    specialization,
    experienceNumber,
    photoPath,
    consultation_fee
  );

  res.status(201).json({
    success: true,
    message: "Doctor created",
    doctorId: insertId,
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

  // const [rows] = await db.query(`SELECT * ${baseQuery} LIMIT ? OFFSET ?`, [
  //   ...values,
  //   limit,
  //   offset,
  // ]);

  // const [[{ count }]] = await db.query(
  //   `SELECT COUNT(*) as count ${baseQuery}`,
  //   values,
  // );

  const rows = await doctorModel.findAll(baseQuery, values, limit, offset);
  const count = await doctorModel.countAll(baseQuery, values);

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

exports.getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await doctorModel.findById(req.params.id);

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    throw error;
  }

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
});

// } catch (error) {
//   // res.status(500).json({ error: error.message });
//   next(error);
// }

exports.updateDoctor = asyncHandler(async (req, res, next) => {
  // try {
  const { id } = req.params;
  const { name, specialization, experience, consultation_fee } = req.body;

  if (!name || !specialization || experience === undefined || consultation_fee === undefined) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  const photoPath = req.file
    ? `uploads/doctors/${req.file.filename}`
    : null;

  const affectedRows = await doctorModel.update(
    id,
    name,
    specialization,
    experience,
    photoPath,
    consultation_fee
  );

  if (affectedRows === 0) {
    // return res.status(404).json({ message: "Doctor not found" });
    const error = new Error("Doctor not found");
    error.statusCode = 404;
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

  const affectedRows = await doctorModel.remove(id);

  if (affectedRows === 0) {
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
