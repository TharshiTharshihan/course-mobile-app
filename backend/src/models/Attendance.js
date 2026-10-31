const mongoose = require("mongoose");

// One row per student, per class, per day. course = null means a general (no specific class) check-in.
const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    date: { type: String, required: true }, // YYYY-MM-DD in Sri Lanka time
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, course: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
