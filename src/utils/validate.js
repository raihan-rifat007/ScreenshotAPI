const env = require("../config/env");
const { resolveDevice } = require("../services/devices");

const FORMATS = new Set(["png", "jpeg", "webp"]);
const WAIT_STATES = new Set(["load", "domcontentloaded", "networkidle"]);
const PDF_FORMATS = new Set(["A4", "A3", "A5", "Letter", "Legal", "Tabloid"]);

function parseScreenshotOptions(query) {
  const errors = [];
  const url = (query.url || "").trim();
  if (!url) errors.push("url is required");

  const device = query.device ? resolveDevice(query.device) : null;
  if (query.device && !device) errors.push(`unknown device: ${query.device}`);

  let width = device ? device.width : parseInt(query.width, 10) || 1280;
  let height = device ? device.height : parseInt(query.height, 10) || 800;
  width = Math.min(Math.max(width, 200), env.maxViewportWidth);
  height = Math.min(Math.max(height, 200), env.maxViewportHeight);

  const format = FORMATS.has(query.format) ? query.format : "png";
  const quality = query.quality ? Math.min(Math.max(parseInt(query.quality, 10) || 80, 1), 100) : 80;
  const fullPage = query.fullPage === "true";
  const darkMode = query.darkMode === "true";
  const blockAds = query.blockAds !== "false";
  const omitBackground = query.omitBackground === "true";
  const delay = Math.min(Math.max(parseInt(query.delay, 10) || 0, 0), 10000);
  const waitUntil = WAIT_STATES.has(query.waitUntil) ? query.waitUntil : "load";
  const scale = device ? device.deviceScaleFactor : Math.min(Math.max(parseFloat(query.scale) || 1, 1), 3);
  const selector = query.selector ? String(query.selector).trim() : null;
  const isMobile = device ? device.isMobile : query.isMobile === "true";
  const hasTouch = device ? device.hasTouch : isMobile;

  return {
    errors,
    url,
    width,
    height,
    format,
    quality,
    fullPage,
    darkMode,
    blockAds,
    omitBackground,
    delay,
    waitUntil,
    scale,
    selector,
    isMobile,
    hasTouch,
    deviceLabel: device ? device.label : null
  };
}

function parsePdfOptions(query) {
  const errors = [];
  const url = (query.url || "").trim();
  if (!url) errors.push("url is required");

  const format = PDF_FORMATS.has(query.format) ? query.format : "A4";
  const landscape = query.landscape === "true";
  const printBackground = query.printBackground !== "false";
  const scale = Math.min(Math.max(parseFloat(query.scale) || 1, 0.1), 2);
  const margin = query.margin || "0.4in";
  const waitUntil = WAIT_STATES.has(query.waitUntil) ? query.waitUntil : "load";
  const delay = Math.min(Math.max(parseInt(query.delay, 10) || 0, 0), 10000);

  return { errors, url, format, landscape, printBackground, scale, margin, waitUntil, delay };
}

module.exports = { parseScreenshotOptions, parsePdfOptions };
