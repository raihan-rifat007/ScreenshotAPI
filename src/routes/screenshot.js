const { Router } = require("express");
const { parseScreenshotOptions } = require("../utils/validate");
const { capture } = require("../services/captureService");
const { listDevices } = require("../services/devices");

const router = Router();

router.get("/devices", (req, res) => {
  res.json({ status: true, devices: listDevices() });
});

router.get("/", async (req, res, next) => {
  try {
    const options = parseScreenshotOptions(req.query);
    if (options.errors.length > 0) {
      return res.status(400).json({ status: false, errors: options.errors });
    }

    const result = await capture(options);

    res.set("Content-Type", `image/${options.format}`);
    res.set("X-Capture-Time-Ms", String(result.tookMs));
    res.set("X-Cache", result.cached ? "HIT" : "MISS");
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
