const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const upload = require("../middleware/uploadMiddleware");

// router.post("/", doctorController.createDoctor);
router.get("/", doctorController.getDoctors);
router.get("/:id", doctorController.getDoctorById);

router.put('/:id', upload.single('photo'), doctorController.updateDoctor);
router.delete("/:id", doctorController.deleteDoctor);

router.post("/", upload.single("photo"), doctorController.createDoctor);

module.exports = router;
