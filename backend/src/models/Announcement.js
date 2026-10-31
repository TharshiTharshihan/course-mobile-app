const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["announcement", "reminder", "bring"], default: "announcement" },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, trim: true, default: "", maxlength: 2000 },
    // null = every student; otherwise only shown in that class
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
