const mongoose = require("mongoose");

// The class owner. Created on the first login with ADMIN_EMAIL / ADMIN_PASSWORD from .env;
// after that the stored (hashed) password is used and the .env password stops working.
const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "Administrator" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

adminSchema.methods.toSafe = function () {
  return {
    role: "admin",
    _id: this._id,
    fullName: this.fullName,
    email: this.email,
    mustChangePassword: this.mustChangePassword,
  };
};

module.exports = mongoose.model("Admin", adminSchema);
