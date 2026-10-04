const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
