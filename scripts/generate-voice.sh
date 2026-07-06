#!/bin/bash
# macOS の `say` コマンドで読み上げ音声(m4a)を一括生成するスクリプト。
# public/audio/ 以下に <name>.m4a を出力する。再実行可能（既存ファイルは上書き）。
set -euo pipefail

VOICE="Kyoko"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../public/audio"
TMP_AIFF="$(mktemp -t densha-voice).aiff"

mkdir -p "$OUT_DIR"

cleanup() {
  rm -f "$TMP_AIFF"
}
trap cleanup EXIT

# $1: 出力ファイル名（拡張子なし） $2: 読み上げテキスト（ひらがな）
gen() {
  local name="$1"
  local text="$2"
  local out="$OUT_DIR/$name.m4a"
  say -v "$VOICE" -o "$TMP_AIFF" "$text"
  afconvert -f m4af -d aac "$TMP_AIFF" "$out"
  echo "generated: $out"
}

# --- システムボイス ---
gen "welcome" "でんしゃの、せかいへ、ようこそ！"
gen "departure" "しゅっぱつ、しんこう！"
gen "crossing" "カンカンカン！ふみきりだ！"
gen "arrive" "えきに、とうちゃく！"
gen "goal" "しゅうてんに、とうちゃく！おめでとう！"
gen "stamp" "スタンプ、ゲット！"
gen "retry" "もういちど、やってみよう"
gen "correct-1" "せいかい！"
gen "correct-2" "すごい！"
gen "correct-3" "やったね！"

# --- ひらがな（46音） ---
# ローマ字（ヘボン式） と かな の対応表
KANA_ROMAJI=(a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n)
KANA_MOJI=(あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん)

for i in "${!KANA_ROMAJI[@]}"; do
  romaji="${KANA_ROMAJI[$i]}"
  moji="${KANA_MOJI[$i]}"
  gen "kana-$romaji" "$moji"
  gen "q-kana-$romaji" "『${moji}』は、どれかな？"
done

# --- かず（1〜10） ---
NUM_YOMI=(いち に さん よん ご ろく なな はち きゅう じゅう)
NUM_KOSUU=(いっこ にこ さんこ よんこ ごこ ろっこ ななこ はっこ きゅうこ じゅっこ)

for i in "${!NUM_YOMI[@]}"; do
  n=$((i + 1))
  yomi="${NUM_YOMI[$i]}"
  kosuu="${NUM_KOSUU[$i]}"
  gen "num-$n" "$yomi"
  gen "q-kazu-$n" "コンテナを、${kosuu}、のせてね"
done

# --- ことば（10語） ---
WORD_IDS=(fumikiri shingou densha senro eki kaisatsu kippu tonneru kamotsu shinkansen)
WORD_YOMI=(ふみきり しんごう でんしゃ せんろ えき かいさつ きっぷ とんねる かもつれっしゃ しんかんせん)

for i in "${!WORD_IDS[@]}"; do
  id="${WORD_IDS[$i]}"
  yomi="${WORD_YOMI[$i]}"
  gen "word-$id" "$yomi"
  gen "q-word-$id" "${yomi}は、どれかな？"
done

echo "done."
