// Attendance days are counted in Sri Lanka time, whatever timezone the server runs in.
const TZ = process.env.TZ_NAME || "Asia/Colombo";

const dayKey = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const today = () => dayKey();
const isDayKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

module.exports = { dayKey, today, isDayKey };
