const crypto = require("crypto");
const { withPage, restartBrowser } = require("../lib/browser");
const { assertPublicUrl } = require("../lib/ssrfGuard");
const { isValidPdfBuffer } = require("../utils/imageValidate");
const cache = require("../lib/cache");
const logger = require("../lib/logger");
const env = require("../config/env");

function cacheKey(options) {
  const hash = crypto.createHash("sha1");
  hash.update(`pdf:${JSON.stringify(options)}`);
  return `pdf:${hash.digest("hex")}`;
}

async function renderPdf(options) {
  return withPage(async (page, context) => {
    context.setDefaultNavigationTimeout(env.navTimeoutMs);
    await page.goto(options.url, { waitUntil: options.waitUntil, timeout: env.navTimeoutMs });

    if (options.delay > 0) {
      await page.waitForTimeout(options.delay);
    }

    return page.pdf({
      format: options.format,
      landscape: options.landscape,
      printBackground: options.printBackground,
      scale: options.scale,
      margin: {
        top: options.margin,
        bottom: options.margin,
        left: options.margin,
        right: options.margin
      }
    });
  });
}

async function generatePdf(options) {
  const key = cacheKey(options);
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  await assertPublicUrl(options.url);

  const startedAt = Date.now();
  let buffer = await renderPdf(options);

  if (!isValidPdfBuffer(buffer)) {
    logger.warn({ url: options.url }, "pdf render produced invalid output, restarting browser and retrying once");
    await restartBrowser();
    buffer = await renderPdf(options);
  }

  if (!isValidPdfBuffer(buffer)) {
    const err = new Error(
      "PDF rendering produced invalid output twice in a row. The browser instance may be unstable " +
        "in this environment — check available memory, or hit /api/health?selftest=true to confirm."
    );
    err.status = 502;
    throw err;
  }

  const result = { buffer, bytes: buffer.length, tookMs: Date.now() - startedAt };
  cache.set(key, result);
  return { ...result, cached: false };
}

module.exports = { generatePdf };
