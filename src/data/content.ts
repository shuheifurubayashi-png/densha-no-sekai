export const STATIONS = [
  { id: 'st1', type: 'hiragana', name: 'あいうえおえき', emoji: '🔤' },
  { id: 'st2', type: 'kazu', name: 'かもつえき', emoji: '📦' },
  { id: 'st3', type: 'kotoba', name: 'ことばえき', emoji: '💬' },
  { id: 'st4', type: 'hiragana', name: 'ひらがなえき', emoji: '🔤' },
  { id: 'st5', type: 'kazu', name: 'かずのえき', emoji: '🔢' },
  { id: 'st6', type: 'kotoba', name: 'しゅうてん', emoji: '🎆' },
] as const;

export type Station = (typeof STATIONS)[number];
export type StationType = Station['type'];

/**
 * 周回ごとに出題するひらがなのセット（累積配列）。
 * loop1: あ〜こ(10)、loop2: あ〜そ(15)、loop3: あ〜と(20)、loop4: あ〜の(25)、
 * loop5: あ〜も(35)、loop6: 清音46音すべて、loop7以降: 46音+濁音・半濁音(が〜ぽ25)。
 */
export const KANA_SETS: readonly string[][] = [
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
  ],
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
  ],
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
  ],
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
  ],
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
  ],
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
    'や', 'ゆ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ',
    'わ', 'を', 'ん',
  ],
  [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
    'や', 'ゆ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ',
    'わ', 'を', 'ん',
    'が', 'ぎ', 'ぐ', 'げ', 'ご',
    'ざ', 'じ', 'ず', 'ぜ', 'ぞ',
    'だ', 'ぢ', 'づ', 'で', 'ど',
    'ば', 'び', 'ぶ', 'べ', 'ぼ',
    'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
  ],
];

/**
 * loopIndex（0始まり）に対応するひらがな出題セットを返す。
 * 定義済みセットを超える周回は最後（=なにぬねの まで累積）のセットを使う。
 */
export function getKanaSetForLoop(loopIndex: number): readonly string[] {
  const index = Math.min(loopIndex, KANA_SETS.length - 1);
  return KANA_SETS[index];
}

/**
 * ひらがな→ローマ字（ヘボン式）の音声ファイル名マッピング。
 * 例: あ→'a', し→'shi', ち→'chi', つ→'tsu', ふ→'fu', じ→'ji', を→'wo', ん→'n'
 */
export const KANA_ROMAJI: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  わ: 'wa', を: 'wo', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
};

export interface Word {
  id: string;
  label: string;
  emoji: string;
}

export const WORDS: Word[] = [
  { id: 'fumikiri', label: 'ふみきり', emoji: '🚧' },
  { id: 'shingou', label: 'しんごう', emoji: '🚦' },
  { id: 'densha', label: 'でんしゃ', emoji: '🚃' },
  { id: 'senro', label: 'せんろ', emoji: '🛤️' },
  { id: 'eki', label: 'えき', emoji: '🏫' },
  { id: 'kaisatsu', label: 'かいさつ', emoji: '🎫' },
  { id: 'kippu', label: 'きっぷ', emoji: '🎟️' },
  { id: 'tonneru', label: 'とんねる', emoji: '⛰️' },
  { id: 'kamotsu', label: 'かもつれっしゃ', emoji: '🚂' },
  { id: 'shinkansen', label: 'しんかんせん', emoji: '🚄' },
  { id: 'basu', label: 'ばす', emoji: '🚌' },
  { id: 'hikouki', label: 'ひこうき', emoji: '✈️' },
  { id: 'fune', label: 'ふね', emoji: '⛴️' },
  { id: 'jitensha', label: 'じてんしゃ', emoji: '🚲' },
  { id: 'shoubousha', label: 'しょうぼうしゃ', emoji: '🚒' },
  { id: 'kyuukyuusha', label: 'きゅうきゅうしゃ', emoji: '🚑' },
];

/**
 * 周回ごとの数あそびの出題範囲。loop1=1〜5, loop2=1〜7, loop3以降=1〜10。
 */
export const KAZU_RANGE: readonly { min: number; max: number }[] = [
  { min: 1, max: 5 },
  { min: 1, max: 7 },
  { min: 1, max: 10 },
];

export function getKazuRangeForLoop(loopIndex: number): { min: number; max: number } {
  const index = Math.min(loopIndex, KAZU_RANGE.length - 1);
  return KAZU_RANGE[index];
}

/** 1駅あたりの出題数。 */
export const QUESTIONS_PER_STATION = 4;

/** 選択肢カードの枚数。 */
export const CHOICE_COUNT = 4;
