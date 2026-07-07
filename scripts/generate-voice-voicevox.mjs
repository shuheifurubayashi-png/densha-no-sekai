// VOICEVOX エンジン（起動済み想定: http://127.0.0.1:50021）で読み上げ音声(m4a)を
// 一括生成するスクリプト。public/audio/ 以下に <name>.m4a を出力する（再実行可能・上書き）。
// 話者: ずんだもん（あまあま） speaker id = 1
import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'audio');
mkdirSync(outDir, { recursive: true });

const ENGINE_URL = 'http://127.0.0.1:50021';
const SPEAKER = 1; // ずんだもん あまあま
const SPEED_SCALE = 0.95;
const INTONATION_SCALE = 1.2;
const VOLUME_SCALE = 0.9;
const CONCAT_SAMPLE_RATE = 24000;

// --- CLI引数 ---
const argv = process.argv.slice(2);
const onlyIndex = argv.indexOf('--only');
const ONLY_FILTER = onlyIndex !== -1 ? argv[onlyIndex + 1] : null;
let skippedCount = 0;

function shouldGenerate(name) {
  if (!ONLY_FILTER) return true;
  const match = name.includes(ONLY_FILTER);
  if (!match) skippedCount += 1;
  return match;
}

// WAVバイナリからチャンクを走査し、指定idのチャンク本体(Buffer)を返す。
// 固定44バイトヘッダを前提にせず、RIFFチャンク構造を正しく解釈する。
function findChunk(wavBuf, chunkId) {
  if (wavBuf.toString('ascii', 0, 4) !== 'RIFF' || wavBuf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('invalid WAV: missing RIFF/WAVE header');
  }
  let offset = 12;
  while (offset + 8 <= wavBuf.length) {
    const id = wavBuf.toString('ascii', offset, offset + 4);
    const size = wavBuf.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;
    if (id === chunkId) {
      return wavBuf.subarray(bodyStart, bodyStart + size);
    }
    // チャンクは偶数バイト境界にパディングされる
    offset = bodyStart + size + (size % 2);
  }
  return null;
}

// PCM16 mono の data チャンク群を1本のWAVに連結する。
function buildConcatenatedWav(dataChunks, sampleRate) {
  const dataSize = dataChunks.reduce((sum, d) => sum + d.length, 0);
  const byteRate = sampleRate * 2;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmtチャンクサイズ
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // モノラル
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32); // ブロックアライン
  header.writeUInt16LE(16, 34); // ビット深度
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, ...dataChunks]);
}

// WAVバッファをm4aへ変換して書き出す（一時WAVは変換後に削除）。
function writeM4aFromWav(name, wavBuf) {
  const tmpWavPath = path.join(outDir, `${name}.tmp.wav`);
  const outPath = path.join(outDir, `${name}.m4a`);
  writeFileSync(tmpWavPath, wavBuf);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', tmpWavPath, outPath]);
  unlinkSync(tmpWavPath);
  console.log(`generated: ${outPath}`);
}

// $1: 出力ファイル名（拡張子なし） $2: 読み上げテキスト（ひらがな）
async function gen(name, text) {
  if (!shouldGenerate(name)) return;

  const queryUrl = `${ENGINE_URL}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(text)}`;
  const queryRes = await fetch(queryUrl, { method: 'POST' });
  if (!queryRes.ok) {
    throw new Error(`audio_query failed for "${name}": ${queryRes.status} ${await queryRes.text()}`);
  }
  const query = await queryRes.json();
  query.speedScale = SPEED_SCALE;
  query.intonationScale = INTONATION_SCALE;
  query.volumeScale = VOLUME_SCALE;

  const synthUrl = `${ENGINE_URL}/synthesis?speaker=${SPEAKER}`;
  const synthRes = await fetch(synthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) {
    throw new Error(`synthesis failed for "${name}": ${synthRes.status} ${await synthRes.text()}`);
  }
  const wavBuf = Buffer.from(await synthRes.arrayBuffer());

  writeM4aFromWav(name, wavBuf);
}

/**
 * 複数の音声セグメントを合成し、1本のWAVに連結してm4aへ書き出す。
 * segment = { text, speedScale?, volumeScale?, intonationScale?, prePhonemeLength?, postPhonemeLength? }
 * 指定のないフィールドは現行のデフォルト値（SPEED_SCALE等 / VOICEVOXクエリ既定値）を使う。
 * 連結の安全性のため、各セグメントの outputSamplingRate/outputStereo は強制的に揃える。
 */
async function genSegments(name, segments) {
  if (!shouldGenerate(name)) return;

  const dataChunks = [];

  for (const segment of segments) {
    const segmentSpeaker = segment.speaker ?? SPEAKER;
    const queryUrl = `${ENGINE_URL}/audio_query?speaker=${segmentSpeaker}&text=${encodeURIComponent(segment.text)}`;
    const queryRes = await fetch(queryUrl, { method: 'POST' });
    if (!queryRes.ok) {
      throw new Error(`audio_query failed for "${name}" segment "${segment.text}": ${queryRes.status} ${await queryRes.text()}`);
    }
    const query = await queryRes.json();

    query.speedScale = segment.speedScale ?? SPEED_SCALE;
    query.volumeScale = segment.volumeScale ?? VOLUME_SCALE;
    query.intonationScale = segment.intonationScale ?? INTONATION_SCALE;
    if (segment.prePhonemeLength !== undefined) query.prePhonemeLength = segment.prePhonemeLength;
    if (segment.postPhonemeLength !== undefined) query.postPhonemeLength = segment.postPhonemeLength;

    // 連結時に破綻しないよう、サンプリングレート/チャンネル数を強制的に統一する
    query.outputSamplingRate = CONCAT_SAMPLE_RATE;
    query.outputStereo = false;

    const synthUrl = `${ENGINE_URL}/synthesis?speaker=${segmentSpeaker}`;
    const synthRes = await fetch(synthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    if (!synthRes.ok) {
      throw new Error(`synthesis failed for "${name}" segment "${segment.text}": ${synthRes.status} ${await synthRes.text()}`);
    }
    const wavBuf = Buffer.from(await synthRes.arrayBuffer());
    const dataChunk = findChunk(wavBuf, 'data');
    if (!dataChunk) {
      throw new Error(`no "data" chunk found in synthesis result for "${name}" segment "${segment.text}"`);
    }
    dataChunks.push(dataChunk);
  }

  const combinedWav = buildConcatenatedWav(dataChunks, CONCAT_SAMPLE_RATE);
  writeM4aFromWav(name, combinedWav);
}

// --- ひらがな1文字だけを、はっきり・張りのある声で読むセグメント ---
// あまあま(1)+低速(0.7)では吐息のような発声になったため、聞き比べの上で
// ノーマル声質(3)+「い！」形式+0.9倍速を採用(2026-07-07 ユーザー選定)
function kanaAloneSegment(moji) {
  return {
    text: `${moji}！`,
    speaker: 3,
    speedScale: 0.9,
    volumeScale: 1.2,
    intonationScale: 1.3,
    prePhonemeLength: 0.15,
    postPhonemeLength: 0.6,
  };
}

// --- 「〜は、どれかな？」を現行デフォルトの調子で読むセグメント ---
function questionSegment(text) {
  return {
    text,
    speedScale: 0.95,
    intonationScale: 1.2,
    volumeScale: 0.9,
  };
}

async function main() {
  // --- システムボイス ---
  await gen('welcome', 'でんしゃの、せかいへ、ようこそ！');
  await gen('departure', 'しゅっぱつ、しんこう！');
  await gen('crossing', 'カンカンカン！ふみきりだ！');
  await gen('arrive', 'えきに、とうちゃく！');
  await gen('goal', 'しゅうてんに、とうちゃく！おめでとう！');
  await gen('stamp', 'スタンプ、ゲット！');
  await gen('retry', 'もういちど、やってみよう');
  await gen('correct-1', 'せいかい！');
  await gen('correct-2', 'すごい！');
  await gen('correct-3', 'やったね！');

  // --- ひらがな（46音） ---
  const KANA_ROMAJI = ['a', 'i', 'u', 'e', 'o', 'ka', 'ki', 'ku', 'ke', 'ko', 'sa', 'shi', 'su', 'se', 'so', 'ta', 'chi', 'tsu', 'te', 'to', 'na', 'ni', 'nu', 'ne', 'no', 'ha', 'hi', 'fu', 'he', 'ho', 'ma', 'mi', 'mu', 'me', 'mo', 'ya', 'yu', 'yo', 'ra', 'ri', 'ru', 're', 'ro', 'wa', 'wo', 'n'];
  const KANA_MOJI = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん'];

  for (let i = 0; i < KANA_ROMAJI.length; i++) {
    const romaji = KANA_ROMAJI[i];
    const moji = KANA_MOJI[i];
    await gen(`kana-${romaji}`, moji);
    await genSegments(`kana-slow-${romaji}`, [kanaAloneSegment(moji)]);
    await genSegments(`q-kana-${romaji}`, [kanaAloneSegment(moji), questionSegment(`${moji}は、どれかな？`)]);
  }

  // --- 濁音・半濁音（23音） ---
  // ぢ(ji)/づ(zu) は じ/ず と同名になるため対象外
  const DAKUON_ROMAJI = ['ga', 'gi', 'gu', 'ge', 'go', 'za', 'ji', 'zu', 'ze', 'zo', 'da', 'de', 'do', 'ba', 'bi', 'bu', 'be', 'bo', 'pa', 'pi', 'pu', 'pe', 'po'];
  const DAKUON_MOJI = ['が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'だ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'];

  for (let i = 0; i < DAKUON_ROMAJI.length; i++) {
    const romaji = DAKUON_ROMAJI[i];
    const moji = DAKUON_MOJI[i];
    await gen(`kana-${romaji}`, moji);
    await genSegments(`kana-slow-${romaji}`, [kanaAloneSegment(moji)]);
    await genSegments(`q-kana-${romaji}`, [kanaAloneSegment(moji), questionSegment(`${moji}は、どれかな？`)]);
  }

  // --- かず（1〜10） ---
  const NUM_YOMI = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];
  const NUM_KOSUU = ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ'];

  for (let i = 0; i < NUM_YOMI.length; i++) {
    const n = i + 1;
    const yomi = NUM_YOMI[i];
    const kosuu = NUM_KOSUU[i];
    await gen(`num-${n}`, yomi);
    await gen(`q-kazu-${n}`, `コンテナを、${kosuu}、のせてね`);
  }

  // --- かず確認 ---
  await gen('q-kazu-check', 'いくつ、のせたかな？');

  // --- ことば（10語＋新規6語） ---
  const WORD_IDS = ['fumikiri', 'shingou', 'densha', 'senro', 'eki', 'kaisatsu', 'kippu', 'tonneru', 'kamotsu', 'shinkansen', 'basu', 'hikouki', 'fune', 'jitensha', 'shoubousha', 'kyuukyuusha'];
  const WORD_YOMI = ['ふみきり', 'しんごう', 'でんしゃ', 'せんろ', 'えき', 'かいさつ', 'きっぷ', 'とんねる', 'かもつれっしゃ', 'しんかんせん', 'ばす', 'ひこうき', 'ふね', 'じてんしゃ', 'しょうぼうしゃ', 'きゅうきゅうしゃ'];

  for (let i = 0; i < WORD_IDS.length; i++) {
    const id = WORD_IDS[i];
    const yomi = WORD_YOMI[i];
    await gen(`word-${id}`, yomi);
    await gen(`q-word-${id}`, `${yomi}は、どれかな？`);
  }

  // --- いろ（でんしゃの色あそび） ---
  await gen('q-iro-aka', 'あかい でんしゃは、どれかな？');
  await gen('q-iro-ao', 'あおい でんしゃは、どれかな？');
  await gen('q-iro-kiiro', 'きいろい でんしゃは、どれかな？');
  await gen('q-iro-midori', 'みどりの でんしゃは、どれかな？');
  await gen('q-iro-shiro', 'しろい でんしゃは、どれかな？');
  await gen('q-iro-kuro', 'くろい でんしゃは、どれかな？');

  await gen('iro-aka', 'あか！');
  await gen('iro-ao', 'あお！');
  await gen('iro-kiiro', 'きいろ！');
  await gen('iro-midori', 'みどり！');
  await gen('iro-shiro', 'しろ！');
  await gen('iro-kuro', 'くろ！');

  // --- おと確認 ---
  await gen('q-oto', 'いまの おとは、なんの おとかな？');

  // --- しゃこ（車両解放/選択） ---
  await gen('get-train', 'あたらしい でんしゃを げっと！');
  await gen('shako-intro', 'すきな でんしゃを えらんでね');

  // --- 車両名（TRAINSロースター） ---
  await gen('train-akai-densha', 'あかいでんしゃ！');
  await gen('train-midori-densha', 'みどりのでんしゃ！');
  await gen('train-tokkyuu', 'とっきゅう！');
  await gen('train-kamotsu', 'かもつれっしゃ！');
  await gen('train-shinkansen', 'しんかんせん！');
  await gen('train-yakou-ressha', 'やこうれっしゃ！');
  await gen('train-kiiroi-densha', 'きいろいけんそくでんしゃ！');
  await gen('train-kin-no-densha', 'きんのでんしゃ！');

  console.log('done.');
  if (ONLY_FILTER) {
    console.log(`--only "${ONLY_FILTER}" によりスキップした件数: ${skippedCount}`);
  }
}

main().catch((err) => {
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) {
    console.error(`VOICEVOXエンジンが起動していません (${ENGINE_URL})。VOICEVOXを起動してから再実行してください。`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
