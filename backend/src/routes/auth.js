const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Counter = require("../models/Counter");
const { auth } = require("../middleware/auth");

const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });

// Student sign up
router.post("/register", async (req, res) => {
  try {
    const { fullName, phone, email, password, confirmPassword } = req.body;
    if (!fullName || !phone || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "Name, phone, email, password and confirmation are required" });
    if (password.length < 5) return res.status(400).json({ message: "Password must be at least 5 characters" });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await Student.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const counter = await Counter.findOneAndUpdate(
      { _id: "students" },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const student = await Student.create({
      fullName,
      studentId: `s${String(counter.sequence).padStart(4, "0")}`,
      email: normalizedEmail,
      phone: phone.trim(),
      password: await bcrypt.hash(password, 10),
    });
    res.status(201).json({
      token: sign({ id: student._id, role: "student" }),
      user: { role: "student", ...student.toSafe() },
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Students may update only their own name and phone number.
router.put("/me", auth, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ message: "Student only" });
  const { fullName, phone } = req.body;
  if (!fullName || !phone) return res.status(400).json({ message: "Name and phone are required" });

  const student = await Student.findByIdAndUpdate(
    req.user.id,
    { fullName: fullName.trim(), phone: phone.trim() },
    { new: true, runValidators: true }
  );
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ role: "student", ...student.toSafe() });
});

// Login for both admin (hardcoded) and students
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    if (
      email === (process.env.ADMIN_EMAIL || "").toLowerCase() &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return res.json({
        token: sign({ id: "admin", role: "admin" }),
        user: { role: "admin", fullName: "Administrator", email },
      });
    }

    const student = await Student.findOne({ email });
    if (!student || !(await bcrypt.compare(password, student.password)))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      token: sign({ id: student._id, role: "student" }),
      user: { role: "student", ...student.toSafe() },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Current user
router.get("/me", auth, async (req, res) => {
  if (req.user.role === "admin")
    return res.json({ role: "admin", fullName: "Administrator", email: process.env.ADMIN_EMAIL });
  const student = await Student.findById(req.user.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ role: "student", ...student.toSafe() });
});

module.exports = router;
