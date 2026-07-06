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

// $1: 出力ファイル名（拡張子なし） $2: 読み上げテキスト（ひらがな）
async function gen(name, text) {
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

  const tmpWavPath = path.join(outDir, `${name}.tmp.wav`);
  const outPath = path.join(outDir, `${name}.m4a`);
  writeFileSync(tmpWavPath, wavBuf);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', tmpWavPath, outPath]);
  unlinkSync(tmpWavPath);

  console.log(`generated: ${outPath}`);
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
    await gen(`q-kana-${romaji}`, `『${moji}』は、どれかな？`);
  }

  // --- 濁音・半濁音（23音） ---
  // ぢ(ji)/づ(zu) は じ/ず と同名になるため対象外
  const DAKUON_ROMAJI = ['ga', 'gi', 'gu', 'ge', 'go', 'za', 'ji', 'zu', 'ze', 'zo', 'da', 'de', 'do', 'ba', 'bi', 'bu', 'be', 'bo', 'pa', 'pi', 'pu', 'pe', 'po'];
  const DAKUON_MOJI = ['が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'だ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'];

  for (let i = 0; i < DAKUON_ROMAJI.length; i++) {
    const romaji = DAKUON_ROMAJI[i];
    const moji = DAKUON_MOJI[i];
    await gen(`kana-${romaji}`, moji);
    await gen(`q-kana-${romaji}`, `『${moji}』は、どれかな？`);
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

  console.log('done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
