const rateLimit = require("express-rate-limit");
const env = require("../config/env");

module.exports = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, error: "Too many requests, slow down" }
});
