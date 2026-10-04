require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// Uploaded PDFs/notes are served statically
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => res.json({ ok: true, name: "Student QR API" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api", require("./routes/courses"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
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
