// public/icons 用の暫定PWAアイコンPNGを生成するスクリプト。
// 外部ライブラリを使わず、Node標準のzlibでPNGバイナリを直接組み立てる。
// 空色の背景に濃い青の単純な電車シルエットを描く。
import { createWriteStream, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const SKY = [0x87, 0xce, 0xeb];
const BODY = [0x2b, 0x4a, 0x63];
const WINDOW = [0xff, 0xff, 0xff];
const WHEEL = [0x33, 0x33, 0x33];

function buildPixels(size) {
  const pixels = new Uint8Array(size * size * 3);

  const bodyTop = Math.round(size * 0.35);
  const bodyBottom = Math.round(size * 0.75);
  const bodyLeft = Math.round(size * 0.1);
  const bodyRight = Math.round(size * 0.9);

  const windowTop = bodyTop + Math.round(size * 0.08);
  const windowBottom = bodyTop + Math.round(size * 0.28);
  const windowMargin = Math.round(size * 0.06);
  const windowGap = Math.round(size * 0.05);
  const windowWidth = Math.round((bodyRight - bodyLeft - windowMargin * 2 - windowGap * 2) / 3);

  const wheelY = bodyBottom + Math.round(size * 0.04);
  const wheelRadius = Math.round(size * 0.045);
  const wheelXs = [
    bodyLeft + Math.round(size * 0.15),
    bodyLeft + Math.round((bodyRight - bodyLeft) / 2),
    bodyRight - Math.round(size * 0.15),
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = SKY;

      const inBody = x >= bodyLeft && x < bodyRight && y >= bodyTop && y < bodyBottom;
      if (inBody) {
        color = BODY;

        if (y >= windowTop && y < windowBottom) {
          for (let w = 0; w < 3; w++) {
            const winLeft = bodyLeft + windowMargin + w * (windowWidth + windowGap);
            const winRight = winLeft + windowWidth;
            if (x >= winLeft && x < winRight) {
              color = WINDOW;
              break;
            }
          }
        }
      }

      for (const cx of wheelXs) {
        const dx = x - cx;
        const dy = y - wheelY;
        if (dx * dx + dy * dy <= wheelRadius * wheelRadius) {
          color = WHEEL;
        }
      }

      const idx = (y * size + x) * 3;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
    }
  }

  return pixels;
}

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function buildPng(size) {
  const pixels = buildPixels(size);

  // フィルタタイプ0（None）を各行の先頭に付与する
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * size * 3, size * 3).copy(raw, rowStart + 1);
  }

  const idat = deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: truecolor
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = chunk('IHDR', ihdrData);
  const idatChunk = chunk('IDAT', idat);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idatChunk, iend]);
}

function writePng(size, filename) {
  const buf = buildPng(size);
  const outPath = path.join(outDir, filename);
  const stream = createWriteStream(outPath);
  stream.write(buf);
  stream.end();
  console.log(`generated: ${outPath}`);
}

writePng(192, 'icon-192.png');
writePng(512, 'icon-512.png');
