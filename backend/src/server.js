require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("./asyncErrors");

const app = express();
app.set("trust proxy", 1); // real client IP behind Render's proxy (used by the login limiter)
app.use(cors());
app.use(express.json());

// Uploaded PDFs/notes are served statically
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => res.json({ ok: true, name: "Student QR API" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api", require("./routes/courses"));

app.use((err, req, res, next) => {
  if (err.name === "CastError") return res.status(404).json({ message: "Not found" });
  if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`API running on http://0.0.0.0:${PORT}`));
  })
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });
