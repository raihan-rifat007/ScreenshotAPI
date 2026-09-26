const { Router } = require("express");
const screenshotRoutes = require("./screenshot");
const pdfRoutes = require("./pdf");
const metadataRoutes = require("./metadata");
const healthRoutes = require("./health");

const router = Router();

router.use("/screenshot", screenshotRoutes);
router.use("/pdf", pdfRoutes);
router.use("/metadata", metadataRoutes);
router.use("/health", healthRoutes);

router.get("/", (req, res) => {
  res.json({
    status: true,
    endpoints: {
      screenshot: "/api/screenshot?url=...",
      devices: "/api/screenshot/devices",
      pdf: "/api/pdf?url=...",
      metadata: "/api/metadata?url=...",
      health: "/api/health"
    }
  });
});

module.exports = router;
