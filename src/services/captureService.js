const crypto = require("crypto");
const { withPage, restartBrowser } = require("../lib/browser");
const { assertPublicUrl } = require("../lib/ssrfGuard");
const { isBlocked } = require("../utils/blocklist");
const { isValidImageBuffer } = require("../utils/imageValidate");
const cache = require("../lib/cache");
const logger = require("../lib/logger");
const env = require("../config/env");

function cacheKey(options) {
  const hash = crypto.createHash("sha1");
  hash.update(JSON.stringify(options));
  return `shot:${hash.digest("hex")}`;
}

async function renderScreenshot(options) {
  return withPage(async (page, context) => {
    context.setDefaultNavigationTimeout(env.navTimeoutMs);
    await page.setViewportSize({ width: options.width, height: options.height });

    if (options.darkMode) {
      await page.emulateMedia({ colorScheme: "dark" });
    }

    if (options.blockAds) {
      await page.route("**/*", route => {
        const requestUrl = route.request().url();
        if (isBlocked(requestUrl)) return route.abort();
        return route.continue();
      });
    }

    await page.goto(options.url, { waitUntil: options.waitUntil, timeout: env.navTimeoutMs });

    if (options.delay > 0) {
      await page.waitForTimeout(options.delay);
    }

    const shotType = options.format === "jpeg" ? "jpeg" : options.format === "webp" ? "webp" : "png";
    const baseOptions = { type: shotType, omitBackground: options.omitBackground, timeout: env.navTimeoutMs };
    if (shotType !== "png") baseOptions.quality = options.quality;

    if (options.selector) {
      const element = await page.$(options.selector);
      if (!element) {
        const err = new Error(`Selector not found: ${options.selector}`);
        err.status = 404;
        throw err;
      }
      return element.screenshot(baseOptions);
    }

    return page.screenshot({ ...baseOptions, fullPage: options.fullPage });
  });
}

async function capture(options) {
  const key = cacheKey(options);
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  await assertPublicUrl(options.url);

  const startedAt = Date.now();
  let buffer = await renderScreenshot(options);

  if (!(await isValidImageBuffer(buffer))) {
    logger.warn({ url: options.url }, "capture produced invalid image data, restarting browser and retrying once");
    await restartBrowser();
    buffer = await renderScreenshot(options);
  }

  if (!(await isValidImageBuffer(buffer))) {
    const err = new Error(
      "Rendering produced invalid image data twice in a row. The browser instance may be unstable " +
        "in this environment — check available memory, or hit /api/health?selftest=true to confirm."
    );
    err.status = 502;
    throw err;
  }

  const result = {
    buffer,
    format: options.format,
    width: options.width,
    height: options.height,
    bytes: buffer.length,
    tookMs: Date.now() - startedAt
  };

  cache.set(key, result);
  return { ...result, cached: false };
}

module.exports = { capture };
