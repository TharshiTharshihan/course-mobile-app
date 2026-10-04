const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    batch: { type: String, trim: true, default: "" },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

studentSchema.methods.toSafe = function () {
  const o = this.toObject();
  delete o.password;
  delete o.__v;
  return o;
};

module.exports = mongoose.model("Student", studentSchema);
