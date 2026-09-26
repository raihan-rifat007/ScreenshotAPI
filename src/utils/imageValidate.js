const sharp = require("sharp");

const PDF_SIGNATURE = Buffer.from("%PDF-");
const PDF_EOF = Buffer.from("%%EOF");

async function isValidImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 100) return false;
  try {
    await sharp(buffer).toBuffer();
    return true;
  } catch {
    return false;
  }
}

function isValidPdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 32) return false;
  if (!buffer.subarray(0, 5).equals(PDF_SIGNATURE)) return false;
  const tail = buffer.subarray(Math.max(0, buffer.length - 1024));
  return tail.includes(PDF_EOF);
}

module.exports = { isValidImageBuffer, isValidPdfBuffer };
