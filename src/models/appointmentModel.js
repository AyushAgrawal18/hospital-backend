exports.create = async (connection, doctorId, patientId, appointmentTime) => {
  const [result] = await connection.query(
    "INSERT INTO appointments (doctor_id, patient_id, appointment_time) VALUES (?, ?, ?)",
    [doctorId, patientId, appointmentTime],
  );
  return result.insertId;
};

const db = require("../config/db");

exports.findAppointmentsByDoctorId = async (doctorId) => {
const [rows] = await db.query(
`SELECT 
        appointments.id,
        appointments.appointment_time,
        appointments.status,
        patients.name AS patient_name,
        patients.email,
        patients.phone,
        doctors.name AS doctor_name
     FROM appointments
     JOIN patients ON appointments.patient_id = patients.id
     JOIN doctors ON appointments.doctor_id = doctors.id
     WHERE appointments.doctor_id = ?
     ORDER BY appointment_time ASC`,
[doctorId]
);

return rows;
};
