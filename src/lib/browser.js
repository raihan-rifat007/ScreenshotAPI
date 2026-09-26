const { chromium } = require("playwright");
const logger = require("./logger");
const env = require("../config/env");

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-blink-features=AutomationControlled"
];

let browserPromise = null;
let activeCount = 0;
const queue = [];

async function launchBrowser() {
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  browser.on("disconnected", () => {
    logger.warn("browser disconnected, will relaunch on next request");
    browserPromise = null;
  });
  return browser;
}

function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  return browserPromise;
}

async function restartBrowser() {
  const previous = browserPromise;
  browserPromise = null;
  if (previous) {
    try {
      const browser = await previous;
      await browser.close();
    } catch {}
  }
  return getBrowser();
}

function acquireSlot() {
  if (activeCount < env.maxConcurrency) {
    activeCount += 1;
    return Promise.resolve();
  }
  return new Promise(resolve => queue.push(resolve)).then(() => {
    activeCount += 1;
  });
}

function releaseSlot() {
  activeCount -= 1;
  const next = queue.shift();
  if (next) next();
}

async function withPage(fn) {
  await acquireSlot();
  const browser = await getBrowser();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    return await fn(page, context);
  } finally {
    await context.close().catch(() => {});
    releaseSlot();
  }
}

async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise;
  await browser.close().catch(() => {});
  browserPromise = null;
}

module.exports = { getBrowser, withPage, closeBrowser, restartBrowser };
