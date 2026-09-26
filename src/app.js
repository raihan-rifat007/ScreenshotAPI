const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");
const { nanoid } = require("nanoid");

const env = require("./config/env");
const logger = require("./lib/logger");
const routes = require("./routes");
const auth = require("./middleware/auth");
const rateLimiter = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const { closeBrowser } = require("./lib/browser");

const app = express();

app.set("trust proxy", 2);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.allowedOrigins }));
app.use(express.json());
app.use(pinoHttp({ logger, genReqId: () => nanoid(10) }));
app.use(express.static("public"));

app.use("/api", rateLimiter, auth, routes);

app.use((req, res) => {
  res.status(404).json({ status: false, error: "Endpoint not found" });
});

app.use(errorHandler);

const server = app.listen(env.port, () => {
  logger.info(`screenshot-api listening on ${env.port}`);
});

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  server.close();
  await closeBrowser();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;
