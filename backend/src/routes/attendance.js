const router = require("express").Router();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const { auth, adminOnly } = require("../middleware/auth");
const { verifyQrCode } = require("../qr");
const { today, isDayKey } = require("../dates");

router.use(auth);

const courseFilter = (course) => (course && mongoose.isValidObjectId(course) ? course : null);

// Scan a student QR. Rejects forged/old codes and students no longer in the database.
// With mark=false it only identifies the student.
router.post("/scan", adminOnly, async (req, res) => {
  const { code, course, mark = true } = req.body;
  const parsed = verifyQrCode(code);
  if (!parsed) return res.status(400).json({ status: "invalid", message: "This is not a valid student QR code." });

  const student = await Student.findById(parsed.id);
  if (!student) return res.status(404).json({ status: "not_found", message: "This student is not registered (or was removed)." });
  if ((student.qrVersion || 1) !== parsed.v)
    return res.status(410).json({ status: "revoked", message: "This QR code was replaced. Ask the student to show their latest QR." });

  const safe = student.toSafe();
  if (!mark) return res.json({ status: "identified", student: safe });

  const courseId = courseFilter(course);
  const courseDoc = courseId ? await Course.findById(courseId).select("name code") : null;
  if (courseId && !courseDoc) return res.status(404).json({ status: "error", message: "Class not found" });

  const date = today();
  const existing = await Attendance.findOne({ student: student._id, course: courseId, date });
  if (existing)
    return res.json({ status: "already", student: safe, course: courseDoc, markedAt: existing.markedAt });

  try {
    const rec = await Attendance.create({ student: student._id, course: courseId, date });
    res.status(201).json({ status: "marked", student: safe, course: courseDoc, markedAt: rec.markedAt });
  } catch (e) {
    if (e.code !== 11000) throw e;
    const rec = await Attendance.findOne({ student: student._id, course: courseId, date });
    res.json({ status: "already", student: safe, course: courseDoc, markedAt: rec?.markedAt });
  }
});

// Day report: ?date=YYYY-MM-DD&course=<id|all|general>
router.get("/", adminOnly, async (req, res) => {
  const date = isDayKey(req.query.date) ? req.query.date : today();
  const filter = { date };
  if (req.query.course === "general") filter.course = null;
  else if (courseFilter(req.query.course)) filter.course = req.query.course;

  const [records, students] = await Promise.all([
    Attendance.find(filter).populate("student", "fullName studentId batch").populate("course", "name code").sort({ markedAt: -1 }),
    Student.find().select("fullName studentId batch").sort({ fullName: 1 }),
  ]);

  const present = records.filter((r) => r.student);
  const presentIds = new Set(present.map((r) => String(r.student._id)));
  res.json({
    date,
    total: students.length,
    present: present.map((r) => ({ _id: r._id, student: r.student, course: r.course, markedAt: r.markedAt })),
    absent: students.filter((s) => !presentIds.has(String(s._id))),
  });
});

// Remove a mark made by mistake
router.delete("/:id", adminOnly, async (req, res) => {
  const rec = await Attendance.findByIdAndDelete(req.params.id).catch(() => null);
  if (!rec) return res.status(404).json({ message: "Record not found" });
  res.json({ ok: true });
});

// A student's own history
router.get("/me", async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Student only" });
  const records = await Attendance.find({ student: req.user.id })
    .populate("course", "name code")
    .sort({ markedAt: -1 })
    .limit(60);
  const month = today().slice(0, 7);
  const days = new Set(records.map((r) => r.date));
  res.json({
    totalDays: days.size,
    thisMonth: [...days].filter((d) => d.startsWith(month)).length,
    records: records.map((r) => ({ _id: r._id, date: r.date, course: r.course, markedAt: r.markedAt })),
  });
});

module.exports = router;
