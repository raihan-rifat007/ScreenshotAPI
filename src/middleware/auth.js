const env = require("../config/env");

module.exports = function auth(req, res, next) {
  if (env.apiKeys.length === 0) return next();
  const key = req.get("x-api-key") || req.query.api_key;
  if (key && env.apiKeys.includes(key)) return next();
  return res.status(401).json({ status: false, error: "Missing or invalid API key" });
};
