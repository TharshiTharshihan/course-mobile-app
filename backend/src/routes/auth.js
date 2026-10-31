const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const Counter = require("../models/Counter");
const { auth } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");

const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });
const MIN_PASSWORD = 5;

const session = (doc, role) => ({ token: sign({ id: doc._id, role }), user: role === "admin" ? doc.toSafe() : { role, ...doc.toSafe() } });

// Student sign up
router.post("/register", async (req, res) => {
  try {
    const { fullName, phone, email, password, confirmPassword } = req.body;
    if (!fullName || !phone || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "Name, phone, email, password and confirmation are required" });
    if (password.length < MIN_PASSWORD)
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

    const normalizedEmail = email.toLowerCase().trim();
    const taken = (await Student.exists({ email: normalizedEmail })) || (await Admin.exists({ email: normalizedEmail }));
    if (taken) return res.status(409).json({ message: "Email already registered" });

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
    res.status(201).json(session(student, "student"));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// The first admin login uses ADMIN_EMAIL / ADMIN_PASSWORD from .env and stores the admin in the
// database (flagged to change the password). Once an admin exists, only the stored password works.
async function findAdmin(email, password) {
  const admin = await Admin.findOne({ email });
  if (admin) return (await bcrypt.compare(password, admin.password)) ? admin : null;

  const envEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!envEmail || email !== envEmail || password !== process.env.ADMIN_PASSWORD) return null;
  if (await Admin.exists({})) return null;
  return Admin.create({ email: envEmail, password: await bcrypt.hash(password, 10), mustChangePassword: true });
}

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const admin = await findAdmin(email, password);
    if (admin) {
      req.loginSucceeded();
      return res.json(session(admin, "admin"));
    }

    const student = await Student.findOne({ email });
    if (!student || !(await bcrypt.compare(password, student.password)))
      return res.status(401).json({ message: "Invalid email or password" });

    req.loginSucceeded();
    res.json(session(student, "student"));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Current user
router.get("/me", auth, async (req, res) => {
  if (req.user.role === "admin") {
    const admin = await Admin.findById(req.user.id).catch(() => null);
    if (!admin) return res.status(401).json({ message: "Please sign in again" });
    return res.json(admin.toSafe());
  }
  const student = await Student.findById(req.user.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json({ role: "student", ...student.toSafe() });
});

// Update own profile. Students: name + phone. Admin: name + email.
router.put("/me", auth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const fullName = (req.body.fullName || "").trim();
      const email = (req.body.email || "").toLowerCase().trim();
      if (!fullName || !email) return res.status(400).json({ message: "Name and email are required" });
      if (await Student.exists({ email })) return res.status(409).json({ message: "That email belongs to a student" });
      const admin = await Admin.findByIdAndUpdate(req.user.id, { fullName, email }, { new: true, runValidators: true });
      if (!admin) return res.status(404).json({ message: "Admin not found" });
      return res.json(admin.toSafe());
    }

    const { fullName, phone } = req.body;
    if (!fullName || !phone) return res.status(400).json({ message: "Name and phone are required" });
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { fullName: fullName.trim(), phone: phone.trim() },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ role: "student", ...student.toSafe() });
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 500).json({ message: e.code === 11000 ? "Email already in use" : e.message });
  }
});

// Change own password (admin and students)
router.put("/password", auth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Current and new password are required" });
  if (newPassword.length < MIN_PASSWORD)
    return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD} characters` });
  if (confirmPassword !== undefined && newPassword !== confirmPassword)
    return res.status(400).json({ message: "New passwords do not match" });
  if (newPassword === currentPassword) return res.status(400).json({ message: "Choose a different password" });

  const Model = req.user.role === "admin" ? Admin : Student;
  const doc = await Model.findById(req.user.id).catch(() => null);
  if (!doc) return res.status(404).json({ message: "Account not found" });
  if (!(await bcrypt.compare(currentPassword, doc.password)))
    return res.status(400).json({ message: "Current password is incorrect" });

  doc.password = await bcrypt.hash(newPassword, 10);
  if (req.user.role === "admin") doc.mustChangePassword = false;
  await doc.save();
  res.json(req.user.role === "admin" ? doc.toSafe() : { role: "student", ...doc.toSafe() });
});

module.exports = router;
