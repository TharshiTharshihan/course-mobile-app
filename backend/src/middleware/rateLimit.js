// Small in-memory limiter for the login route: after 10 failed attempts from one IP for one email,
// that pair is blocked for 15 minutes. Good enough for a single server instance.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const fails = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of fails) if (v.until < now) fails.delete(k);
}, WINDOW_MS).unref();

function loginLimiter(req, res, next) {
  const key = `${req.ip}|${String(req.body?.email || "").toLowerCase().trim()}`;
  const entry = fails.get(key);
  if (entry && entry.count >= MAX_FAILS && entry.until > Date.now()) {
    const mins = Math.ceil((entry.until - Date.now()) / 60000);
    return res.status(429).json({ message: `Too many attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` });
  }

  req.loginSucceeded = () => fails.delete(key);
  res.on("finish", () => {
    if (res.statusCode !== 401) return;
    const e = fails.get(key);
    const fresh = !e || e.until < Date.now();
    fails.set(key, { count: fresh ? 1 : e.count + 1, until: Date.now() + WINDOW_MS });
  });
  next();
}

module.exports = { loginLimiter };
