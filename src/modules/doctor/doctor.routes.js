const { protect, authorize } = require("../../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const doctorController = require("./doctor.controller");
const upload = require("../../middleware/uploadMiddleware");

// router.post("/", doctorController.createDoctor);
router.get("/", protect, doctorController.getDoctors);
router.get("/:id", protect, doctorController.getDoctorById);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("photo"),
  doctorController.updateDoctor,
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  doctorController.deleteDoctor,
);

router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("photo"),
  doctorController.createDoctor,
);

module.exports = router;
