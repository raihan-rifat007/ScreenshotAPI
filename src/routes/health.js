const { Router } = require("express");
const cache = require("../lib/cache");
const { getBrowser, withPage } = require("../lib/browser");
const { isValidImageBuffer } = require("../utils/imageValidate");

const router = Router();

async function runSelfTest() {
  const startedAt = Date.now();
  try {
    const buffer = await withPage(async page => {
      await page.setContent(
        "<html><body style='background:#0A0A0A;color:#FAFAFA;font-family:sans-serif'><h1>ok</h1></body></html>"
      );
      return page.screenshot({ type: "png" });
    });
    return {
      ok: isValidImageBuffer(buffer, "png"),
      bytes: buffer.length,
      tookMs: Date.now() - startedAt
    };
  } catch (err) {
    return { ok: false, error: err.message, tookMs: Date.now() - startedAt };
  }
}

router.get("/", async (req, res) => {
  let browserConnected = false;
  try {
    const browser = await getBrowser();
    browserConnected = browser.isConnected();
  } catch {
    browserConnected = false;
  }

  const response = {
    status: true,
    uptime: process.uptime(),
    browserConnected,
    cache: cache.stats()
  };

  if (req.query.selftest === "true") {
    response.renderSelfTest = await runSelfTest();
  }

  res.json(response);
});

module.exports = router;
