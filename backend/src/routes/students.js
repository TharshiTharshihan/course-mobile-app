const router = require("express").Router();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Material = require("../models/Material");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/Announcement");
const { auth, adminOnly } = require("../middleware/auth");
const { today } = require("../dates");

router.use(auth, adminOnly);

// Dashboard numbers
router.get("/stats", async (req, res) => {
  const [students, courses, materials, presentIds, announcements] = await Promise.all([
    Student.countDocuments(),
    Course.countDocuments(),
    Material.countDocuments(),
    Attendance.distinct("student", { date: today() }),
    Announcement.countDocuments(),
  ]);
  res.json({ students, courses, materials, presentToday: presentIds.length, announcements });
});

// List (optional ?q= search)
router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = q
    ? { $or: [{ fullName: new RegExp(q, "i") }, { studentId: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] }
    : {};
  const list = await Student.find(filter).sort({ createdAt: -1 });
  res.json(list.map((s) => s.toSafe()));
});

// Lookup by Mongo id OR studentId
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const student = mongoose.isValidObjectId(id) ? await Student.findById(id) : await Student.findOne({ studentId: id });
  if (!student) return res.status(404).json({ message: "Student not found" });

  const [present, last] = await Promise.all([
    Attendance.distinct("date", { student: student._id }),
    Attendance.findOne({ student: student._id }).sort({ markedAt: -1 }),
  ]);
  res.json({ ...student.toSafe(), attendance: { days: present.length, lastSeen: last?.markedAt || null } });
});

router.put("/:id", async (req, res) => {
  const { department, batch } = req.body;
  const student = await Student.findByIdAndUpdate(req.params.id, { department, batch }, { new: true, runValidators: true });
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student.toSafe());
});

// Issue a new QR; the old one stops working (lost or shared card)
router.post("/:id/reset-qr", async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, { $inc: { qrVersion: 1 } }, { new: true });
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student.toSafe());
});

router.delete("/:id", async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await Attendance.deleteMany({ student: student._id });
  res.json({ ok: true });
});

module.exports = router;
