const { Router } = require("express");
const { withPage } = require("../lib/browser");
const { assertPublicUrl } = require("../lib/ssrfGuard");
const env = require("../config/env");

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const url = (req.query.url || "").trim();
    if (!url) return res.status(400).json({ status: false, errors: ["url is required"] });

    await assertPublicUrl(url);

    const data = await withPage(async (page, context) => {
      context.setDefaultNavigationTimeout(env.navTimeoutMs);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: env.navTimeoutMs });
      return page.evaluate(() => {
        const meta = name =>
          document.querySelector(`meta[name="${name}"]`)?.content ||
          document.querySelector(`meta[property="${name}"]`)?.content ||
          null;
        return {
          title: document.title || null,
          description: meta("description"),
          ogTitle: meta("og:title"),
          ogDescription: meta("og:description"),
          ogImage: meta("og:image"),
          canonical: document.querySelector('link[rel="canonical"]')?.href || null,
          favicon:
            document.querySelector('link[rel="icon"]')?.href ||
            document.querySelector('link[rel="shortcut icon"]')?.href ||
            null,
          language: document.documentElement.lang || null
        };
      });
    });

    res.json({ status: true, url, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
