// Express 4 ignores promises returned by async route handlers, so a thrown error becomes an
// unhandled rejection that crashes Node. This forwards those errors to the error handler instead
// (same as Express's own handle_request, plus the .catch).
const Layer = require("express/lib/router/layer");

Layer.prototype.handle_request = function handle(req, res, next) {
  const fn = this.handle;
  if (fn.length > 3) return next();
  try {
    const result = fn(req, res, next);
    if (result && typeof result.catch === "function") result.catch(next);
  } catch (err) {
    next(err);
  }
};
