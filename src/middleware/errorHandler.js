const logger = require("../lib/logger");

module.exports = function errorHandler(err, req, res, next) {
  logger.error({ err, url: req.originalUrl }, err.message);
  const status = err.status || 500;
  res.status(status).json({ status: false, error: err.message || "Internal server error" });
};
