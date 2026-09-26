const pino = require("pino");
const env = require("../config/env");

module.exports = pino({
  level: env.env === "production" ? "info" : "debug",
  base: { service: "screenshot-api", version: "1.0.0" },
  timestamp: pino.stdTimeFunctions.isoTime
});
