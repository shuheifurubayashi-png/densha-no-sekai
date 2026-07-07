// public/audio 用の効果音(m4a)を生成するスクリプト。
// 外部ライブラリを使わず、Node標準機能でWAV(PCM16)を直接合成し、
// afconvertでAAC(m4a)へ変換する。子ども向けに音量ピークを抑え、
// フェードイン/アウトでクリックノイズを防ぐ。
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'audio');
mkdirSync(outDir, { recursive: true });

const SAMPLE_RATE = 44100;
const PEAK = 0.5; // 子ども向けに耳に痛くない音量に抑える

// --- WAV(PCM16 mono) バイナリ組み立て ---
function buildWav(samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * 2;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16); // fmtチャンクサイズ
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // モノラル
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(2, 32); // ブロックアライン
  buf.writeUInt16LE(16, 34); // ビット深度
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  return buf;
}

// フェードイン/アウトを適用（秒指定）
function applyFade(samples, fadeInSec, fadeOutSec) {
  const fadeInSamples = Math.round(fadeInSec * SAMPLE_RATE);
  const fadeOutSamples = Math.round(fadeOutSec * SAMPLE_RATE);
  const n = samples.length;
  for (let i = 0; i < fadeInSamples && i < n; i++) {
    samples[i] *= i / fadeInSamples;
  }
  for (let i = 0; i < fadeOutSamples && i < n; i++) {
    const idx = n - 1 - i;
    if (idx < 0) break;
    samples[idx] *= i / fadeOutSamples;
  }
  return samples;
}

// 正弦波1音を生成（ADSR風の簡易エンベロープ付き）
function tone(freq, durationSec, { amp = PEAK, fadeIn = 0.01, fadeOut = 0.05 } = {}) {
  const n = Math.round(durationSec * SAMPLE_RATE);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    samples[i] = amp * Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE);
  }
  applyFade(samples, fadeIn, fadeOut);
  return samples;
}

// 複数音を加算（和音）
function chord(freqs, durationSec, opts = {}) {
  const n = Math.round(durationSec * SAMPLE_RATE);
  const samples = new Float64Array(n).fill(0);
  for (const freq of freqs) {
    const t = tone(freq, durationSec, { ...opts, fadeIn: 0, fadeOut: 0 });
    for (let i = 0; i < n; i++) samples[i] += t[i] / freqs.length;
  }
  applyFade(samples, opts.fadeIn ?? 0.01, opts.fadeOut ?? 0.05);
  return samples;
}

// 無音を生成
function silence(durationSec) {
  return new Float64Array(Math.round(durationSec * SAMPLE_RATE));
}

// 複数の音の断片を連結
function concat(parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Float64Array(total);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

// --- 各効果音の合成 ---

// 踏切警報音: 約700Hzの電子ベル的パルスを「カン、カン、カン、カン」と繰り返す
function buildKankan() {
  const pulseDur = 0.15;
  const gapDur = 0.28;
  const pulse = tone(700, pulseDur, { amp: PEAK * 0.9, fadeIn: 0.005, fadeOut: 0.06 });
  const gap = silence(gapDur);
  const parts = [];
  const repeats = 5; // 約2秒
  for (let i = 0; i < repeats; i++) {
    parts.push(pulse);
    parts.push(gap);
  }
  return concat(parts);
}

// 汽笛: 2音の和音を0.6秒程度、アタックとリリース付き
function buildWhistle() {
  return chord([660, 880], 0.6, { amp: PEAK * 0.8, fadeIn: 0.03, fadeOut: 0.15 });
}

// 正解チャイム: ドミソ↑の明るいアルペジオ
function buildCorrect() {
  const noteDur = 0.16;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // ド・ミ・ソ・高いド
  const parts = notes.map((f) => tone(f, noteDur, { amp: PEAK * 0.85, fadeIn: 0.005, fadeOut: 0.06 }));
  return concat(parts);
}

// リトライ: 優しい2音（ソ→ミの下降、柔らかい正弦波）
function buildRetry() {
  const noteDur = 0.35;
  const notes = [783.99, 659.25]; // ソ→ミ
  const parts = notes.map((f) => tone(f, noteDur, { amp: PEAK * 0.6, fadeIn: 0.03, fadeOut: 0.15 }));
  return concat(parts);
}

// ファンファーレ: ドミソド↑、1.5秒程度
function buildFanfare() {
  const notes = [
    { f: 523.25, d: 0.3 }, // ド
    { f: 659.25, d: 0.3 }, // ミ
    { f: 783.99, d: 0.3 }, // ソ
    { f: 1046.5, d: 0.6 }, // 高いド（伸ばす）
  ];
  const parts = notes.map(({ f, d }) => tone(f, d, { amp: PEAK * 0.85, fadeIn: 0.01, fadeOut: d > 0.4 ? 0.3 : 0.05 }));
  return concat(parts);
}

// 短いポップ音: 0.1秒
function buildTap() {
  return tone(900, 0.1, { amp: PEAK * 0.7, fadeIn: 0.002, fadeOut: 0.06 });
}

// 救急車サイレン: 「ピーポーピーポー」。約960Hz/770Hzの2音を0.65秒ずつ交互に、2サイクル
function buildSiren() {
  const toneDur = 0.65;
  const high = tone(960, toneDur, { amp: PEAK * 0.75, fadeIn: 0.02, fadeOut: 0.02 });
  const low = tone(770, toneDur, { amp: PEAK * 0.75, fadeIn: 0.02, fadeOut: 0.02 });
  const parts = [];
  const cycles = 2;
  for (let i = 0; i < cycles; i++) {
    parts.push(high);
    parts.push(low);
  }
  return concat(parts);
}

// 消防車サイレン: 「ウーーー」。400→800→400Hzのゆるやかなサインスイープ、約2.5秒
function buildFiretruck() {
  const durationSec = 2.5;
  const n = Math.round(durationSec * SAMPLE_RATE);
  const samples = new Float64Array(n);
  const fMin = 400;
  const fMax = 800;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // 0→durationSecで 400→800→400Hz と往復するよう三角波でスイープさせる
    const cyclePos = t / durationSec; // 0..1
    const triangle = 1 - Math.abs(2 * cyclePos - 1); // 0→1→0
    const freq = fMin + (fMax - fMin) * triangle;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    samples[i] = PEAK * 0.7 * Math.sin(phase);
  }
  applyFade(samples, 0.05, 0.2);
  return samples;
}

// 自転車ベル: 「チリンチリン」。高音サイン波(約2000Hz)の速い指数減衰を2回
function buildBell() {
  const strikeDur = 0.25;
  const gapDur = 0.12;
  function strike() {
    const n = Math.round(strikeDur * SAMPLE_RATE);
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const decay = Math.exp(-t * 18);
      samples[i] = PEAK * 0.7 * decay * Math.sin((2 * Math.PI * 2000 * i) / SAMPLE_RATE);
    }
    applyFade(samples, 0.002, 0.02);
    return samples;
  }
  return concat([strike(), silence(gapDur), strike()]);
}

// バスのクラクション: 「プップー」。矩形波風の約330Hzトーンを短音0.18秒＋長音0.5秒、間に小さな隙間
function buildHorn() {
  function squareish(durationSec) {
    const n = Math.round(durationSec * SAMPLE_RATE);
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      // 矩形波に近づけるため基音+奇数倍音を少量加算
      const t = i / SAMPLE_RATE;
      const fundamental = Math.sin(2 * Math.PI * 330 * t);
      const third = Math.sin(2 * Math.PI * 330 * 3 * t) / 3;
      const fifth = Math.sin(2 * Math.PI * 330 * 5 * t) / 5;
      samples[i] = PEAK * 0.6 * (fundamental + third + fifth) * 0.6;
    }
    applyFade(samples, 0.01, 0.03);
    return samples;
  }
  return concat([squareish(0.18), silence(0.08), squareish(0.5)]);
}

const SFX = {
  'sfx-kankan': buildKankan,
  'sfx-whistle': buildWhistle,
  'sfx-correct': buildCorrect,
  'sfx-retry': buildRetry,
  'sfx-fanfare': buildFanfare,
  'sfx-tap': buildTap,
  'sfx-siren': buildSiren,
  'sfx-firetruck': buildFiretruck,
  'sfx-bell': buildBell,
  'sfx-horn': buildHorn,
};

for (const [name, builder] of Object.entries(SFX)) {
  const samples = builder();
  const wavBuf = buildWav(samples);
  const tmpWavPath = path.join(outDir, `${name}.tmp.wav`);
  const outPath = path.join(outDir, `${name}.m4a`);

  writeFileSync(tmpWavPath, wavBuf);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', tmpWavPath, outPath]);
  unlinkSync(tmpWavPath);

  console.log(`generated: ${outPath}`);
}

console.log('done.');
