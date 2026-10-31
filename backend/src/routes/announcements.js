const router = require("express").Router();
const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const { auth, adminOnly } = require("../middleware/auth");

router.use(auth);

const TYPES = ["announcement", "reminder", "bring"];

const clean = (body) => {
  const out = {
    type: TYPES.includes(body.type) ? body.type : "announcement",
    title: String(body.title || "").trim(),
    message: String(body.message || "").trim(),
    course: body.course && mongoose.isValidObjectId(body.course) ? body.course : null,
    pinned: !!body.pinned,
  };
  return out;
};

// Everyone signed in sees all announcements, pinned first, newest first.
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.course && mongoose.isValidObjectId(req.query.course)) filter.course = { $in: [null, req.query.course] };
  const list = await Announcement.find(filter)
    .populate("course", "name code")
    .sort({ pinned: -1, createdAt: -1 })
    .limit(100);
  res.json(list);
});

router.post("/", adminOnly, async (req, res) => {
  const data = clean(req.body);
  if (!data.title) return res.status(400).json({ message: "Title is required" });
  const a = await Announcement.create(data);
  res.status(201).json(await a.populate("course", "name code"));
});

router.put("/:id", adminOnly, async (req, res) => {
  const data = clean(req.body);
  if (!data.title) return res.status(400).json({ message: "Title is required" });
  const a = await Announcement.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    .populate("course", "name code")
    .catch(() => null);
  if (!a) return res.status(404).json({ message: "Announcement not found" });
  res.json(a);
});

router.delete("/:id", adminOnly, async (req, res) => {
  const a = await Announcement.findByIdAndDelete(req.params.id).catch(() => null);
  if (!a) return res.status(404).json({ message: "Announcement not found" });
  res.json({ ok: true });
});

module.exports = router;
