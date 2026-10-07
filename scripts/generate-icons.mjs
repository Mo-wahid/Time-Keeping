import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 2; // Truecolor (RGB)
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Non-interlaced

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: filter byte (0) + width * 3 bytes per scanline
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Draw a subtle border/circle or flat emerald green #10b981
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4);
  data.copy(buffer, 8);

  const crc = crc32(buffer.subarray(4, 8 + length));
  buffer.writeInt32BE(crc, 8 + length);
  return buffer;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

// Emerald green (16, 185, 129)
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, 16, 185, 129));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, 16, 185, 129));
fs.writeFileSync(path.join(outDir, 'icon-512-maskable.png'), createPng(512, 512, 16, 185, 129));

console.log('PWA PNG icons generated successfully!');
