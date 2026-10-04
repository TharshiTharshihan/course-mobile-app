const router = require("express").Router();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Material = require("../models/Material");
const { auth, adminOnly } = require("../middleware/auth");

router.use(auth, adminOnly);

// Dashboard numbers
router.get("/stats", async (req, res) => {
  const [students, courses, materials] = await Promise.all([
    Student.countDocuments(),
    Course.countDocuments(),
    Material.countDocuments(),
  ]);
  res.json({ students, courses, materials });
});

// List (optional ?q= search)
router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  const filter = q
    ? {
        $or: [
          { fullName: new RegExp(q, "i") },
          { studentId: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
        ],
      }
    : {};
  const list = await Student.find(filter).select("-password -__v").sort({ createdAt: -1 });
  res.json(list);
});

// Lookup by Mongo id OR studentId (used after scanning a QR)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const student = mongoose.isValidObjectId(id)
    ? await Student.findById(id).select("-password -__v")
    : await Student.findOne({ studentId: id }).select("-password -__v");
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

router.put("/:id", async (req, res) => {
  const { fullName, phone, department, batch } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { fullName, phone, department, batch },
    { new: true, runValidators: true }
  ).select("-password -__v");
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

router.delete("/:id", async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ ok: true });
});

module.exports = router;
