import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateRadioIconPNG(width, height, isMaskable = false) {
  // RGBA buffer with filter byte per line
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: dark slate-900 to dark indigo-950
      let r = 18 + Math.floor((x / width) * 20);
      let g = 24 + Math.floor((y / height) * 15);
      let b = 45 + Math.floor(((x + y) / (width * 2)) * 40);
      let a = 255;

      if (!isMaskable) {
        // Squircle corner mask
        const cornerR = width * 0.22;
        const cornerX = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const cornerY = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const cornerDist = Math.sqrt(cornerX * cornerX + cornerY * cornerY);
        if (cornerDist > cornerR) {
          a = 0; // transparent
        }
      }

      if (a > 0) {
        // Broadcast waves arcs
        const waveScale = width / 256;
        // Central tower circle: dist < 24 * waveScale
        if (dist <= 26 * waveScale) {
          // Purple/Pink core
          r = 139; g = 92; b = 246; // #8b5cf6
          if (dist <= 18 * waveScale) {
            r = 236; g = 72; b = 153; // #ec4899
          }
          // White center dot
          if (dist <= 6 * waveScale) {
            r = 255; g = 255; b = 255;
          }
        } else {
          // Concentric radio wave bands (dist between 45 and 55, 75 and 85, 105 and 115)
          const w1 = Math.abs(dist - 52 * waveScale);
          const w2 = Math.abs(dist - 84 * waveScale);
          const w3 = Math.abs(dist - 116 * waveScale);

          // Angle check: waves emitted left and right
          const angle = Math.abs(Math.atan2(dy, dx));
          const isWaveZone = (angle < 0.85 || angle > (Math.PI - 0.85));

          if (isWaveZone) {
            if (w1 < 7 * waveScale) {
              r = 56; g = 189; b = 248; // Cyan #38bdf8
            } else if (w2 < 7 * waveScale) {
              r = 99; g = 102; b = 241; // Indigo #6366f1
            } else if (w3 < 6 * waveScale) {
              r = 168; g = 85; b = 247; // Purple #a855f7
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generateRadioIconPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generateRadioIconPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), generateRadioIconPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateRadioIconPNG(64, 64, false));

console.log('Generated PWA icon PNGs successfully!');
