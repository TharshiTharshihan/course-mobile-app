const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Course = require("../models/Course");
const Material = require("../models/Material");
const { auth, adminOnly } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const removeFile = (name) => fs.unlink(path.join(uploadDir, name), () => {});

router.use(auth);

// ---------- Courses ----------
router.get("/courses", async (req, res) => {
  const courses = await Course.find().sort({ code: 1 }).lean();
  const counts = await Material.aggregate([{ $group: { _id: "$course", n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(courses.map((c) => ({ ...c, materialCount: map[String(c._id)] || 0 })));
});

router.get("/courses/:id", async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

router.post("/courses", adminOnly, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ message: "Course name and code are required" });
    const course = await Course.create({ name, code, description });
    res.status(201).json(course);
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 500).json({
      message: e.code === 11000 ? "Course code already exists" : e.message,
    });
  }
});

router.put("/courses/:id", adminOnly, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, code, description },
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 500).json({
      message: e.code === 11000 ? "Course code already exists" : e.message,
    });
  }
});

router.delete("/courses/:id", adminOnly, async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const mats = await Material.find({ course: course._id });
  mats.forEach((m) => removeFile(m.fileName));
  await Material.deleteMany({ course: course._id });
  res.json({ ok: true });
});

// ---------- Materials ----------
router.get("/courses/:id/materials", async (req, res) => {
  const list = await Material.find({ course: req.params.id }).sort({ createdAt: -1 });
  res.json(list);
});

router.post("/courses/:id/materials", adminOnly, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const material = await Material.create({
      course: req.params.id,
      title: (req.body.title || "").trim() || req.file.originalname,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
    res.status(201).json(material);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/materials/:id", adminOnly, async (req, res) => {
  const material = await Material.findByIdAndUpdate(
    req.params.id,
    { title: req.body.title },
    { new: true, runValidators: true }
  );
  if (!material) return res.status(404).json({ message: "Material not found" });
  res.json(material);
});

router.delete("/materials/:id", adminOnly, async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id);
  if (!material) return res.status(404).json({ message: "Material not found" });
  removeFile(material.fileName);
  res.json({ ok: true });
});

module.exports = router;
