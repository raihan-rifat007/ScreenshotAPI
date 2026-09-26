const BLOCKED_HOST_FRAGMENTS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "google-analytics.com",
  "googletagmanager.com",
  "facebook.com/tr",
  "connect.facebook.net",
  "hotjar.com",
  "segment.io",
  "mixpanel.com",
  "amplitude.com",
  "intercom.io",
  "crisp.chat",
  "taboola.com",
  "outbrain.com",
  "adsrvr.org",
  "criteo.com",
  "pubmatic.com",
  "rubiconproject.com",
  "quantserve.com",
  "scorecardresearch.com"
];

function isBlocked(url) {
  return BLOCKED_HOST_FRAGMENTS.some(fragment => url.includes(fragment));
}

module.exports = { isBlocked, BLOCKED_HOST_FRAGMENTS };
