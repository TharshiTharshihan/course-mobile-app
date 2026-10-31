const crypto = require("crypto");

// Student QR format: SQR1.<mongoId>.<qrVersion>.<signature>
// The signature is an HMAC only the server can make, so a QR cannot be forged or edited.
// It carries no personal data; the scanner always looks the student up in the database.
const PREFIX = "SQR1";

const secret = () => process.env.QR_SECRET || process.env.JWT_SECRET;

const sign = (id, v) =>
  crypto.createHmac("sha256", secret()).update(`${PREFIX}.${id}.${v}`).digest("base64url").slice(0, 22);

const qrCodeFor = (student) => {
  const v = student.qrVersion || 1;
  return `${PREFIX}.${student._id}.${v}.${sign(student._id, v)}`;
};

/** Returns { id, v } for a correctly signed code, otherwise null. */
const verifyQrCode = (code) => {
  const parts = String(code || "").trim().split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) return null;
  const [, id, vRaw, sig] = parts;
  const v = Number(vRaw);
  if (!/^[a-f0-9]{24}$/i.test(id) || !Number.isInteger(v) || v < 1) return null;
  const expected = Buffer.from(sign(id, v));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  return { id, v };
};

module.exports = { qrCodeFor, verifyQrCode };
