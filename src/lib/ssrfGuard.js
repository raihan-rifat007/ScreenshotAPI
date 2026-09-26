const dns = require("dns").promises;
const net = require("net");
const env = require("../config/env");

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "metadata.google.internal"]);

function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 0) return true;
  return false;
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("::ffff:")) return isPrivateIPv4(lower.split("::ffff:")[1]);
  return false;
}

function isPrivateIP(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

async function assertPublicUrl(rawUrl) {
  if (env.allowPrivateUrls) return;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    const err = new Error("Invalid URL");
    err.status = 400;
    throw err;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const err = new Error("Only http and https URLs are allowed");
    err.status = 400;
    throw err;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    const err = new Error("This host is not allowed");
    err.status = 400;
    throw err;
  }

  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      const err = new Error("Private and reserved IP addresses are not allowed");
      err.status = 400;
      throw err;
    }
    return;
  }

  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    const err = new Error("Could not resolve host");
    err.status = 400;
    throw err;
  }

  if (records.length === 0) {
    const err = new Error("Could not resolve host");
    err.status = 400;
    throw err;
  }

  for (const record of records) {
    if (isPrivateIP(record.address)) {
      const err = new Error("This host resolves to a private or reserved address");
      err.status = 400;
      throw err;
    }
  }
}

module.exports = { assertPublicUrl };
