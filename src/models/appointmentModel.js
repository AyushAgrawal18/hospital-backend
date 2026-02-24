exports.create = async (connection, doctorId, patientId, appointmentTime) => {
  const [result] = await connection.query(
    "INSERT INTO appointments (doctor_id, patient_id, appointment_time) VALUES (?, ?, ?)",
    [doctorId, patientId, appointmentTime],
  );
  return result.insertId;
};
