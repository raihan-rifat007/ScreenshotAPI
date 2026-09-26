require("dotenv").config();

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function toInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  port: toInt(process.env.PORT, 3000),
  env: process.env.NODE_ENV || "development",
  apiKeys: (process.env.API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean),
  allowedOrigins: process.env.ALLOWED_ORIGINS || "*",
  allowPrivateUrls: toBool(process.env.ALLOW_PRIVATE_URLS, false),
  navTimeoutMs: toInt(process.env.NAV_TIMEOUT_MS, 30000),
  maxConcurrency: toInt(process.env.BROWSER_MAX_CONCURRENCY, 2),
  cacheTtlSeconds: toInt(process.env.CACHE_TTL_SECONDS, 600),
  cacheMaxItems: toInt(process.env.CACHE_MAX_ITEMS, 200),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 30),
  maxViewportWidth: toInt(process.env.MAX_VIEWPORT_WIDTH, 3840),
  maxViewportHeight: toInt(process.env.MAX_VIEWPORT_HEIGHT, 2160)
};
