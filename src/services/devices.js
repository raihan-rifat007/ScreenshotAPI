const DEVICES = {
  "desktop-hd": { label: "Desktop HD", width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  "desktop": { label: "Desktop", width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  "laptop": { label: "Laptop", width: 1280, height: 800, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
  "ipad-pro": { label: "iPad Pro 12.9", width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  "ipad": { label: "iPad", width: 810, height: 1080, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  "iphone-15-pro": { label: "iPhone 15 Pro", width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  "iphone-se": { label: "iPhone SE", width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  "pixel-8": { label: "Pixel 8", width: 412, height: 915, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true },
  "galaxy-s24": { label: "Galaxy S24", width: 384, height: 824, deviceScaleFactor: 2.8, isMobile: true, hasTouch: true }
};

function resolveDevice(key) {
  if (!key) return null;
  return DEVICES[key.toLowerCase()] || null;
}

function listDevices() {
  return Object.entries(DEVICES).map(([id, device]) => ({ id, ...device }));
}

module.exports = { DEVICES, resolveDevice, listDevices };
