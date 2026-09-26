const { Router } = require("express");
const { parsePdfOptions } = require("../utils/validate");
const { generatePdf } = require("../services/pdfService");

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const options = parsePdfOptions(req.query);
    if (options.errors.length > 0) {
      return res.status(400).json({ status: false, errors: options.errors });
    }

    const result = await generatePdf(options);

    res.set("Content-Type", "application/pdf");
    res.set("X-Capture-Time-Ms", String(result.tookMs));
    res.set("X-Cache", result.cached ? "HIT" : "MISS");
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
