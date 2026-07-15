/**
 * コレクション車両のSVGアート集。
 * すべての車両は「線路の上面 = y0、車体中心 = x0」に正規化されている。
 * 横幅はおよそ x -105〜+105。車輪には map-wheel クラスを付け、
 * map画面の走行アニメ(車輪回転)をそのまま流用できるようにする。
 */

export interface TrainArtOptions {
  /** 車体色の上書き(いろゲーム用)。akai-densha ベース形状に適用される */
  bodyColor?: string;
}

function wheel(cx: number, r = 7): string {
  return `<circle class="map-wheel" cx="${cx}" cy="${-r}" r="${r}" fill="#3a3a3a" /><circle cx="${cx}" cy="${-r}" r="${(r * 0.4).toFixed(1)}" fill="#8a8a8a" />`;
}

function windowRect(x: number, y: number, w = 14, h = 13): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#bfe8ff" />`;
}

/** 絵本調: あかいでんしゃ(初期車両)。bodyColorで色替え可能 */
function akaiDensha(body: string): string {
  const dark = '#00000033';
  const car = (x: number): string => `
    <g transform="translate(${x},0)">
      <rect x="0" y="-40" width="52" height="33" rx="9" fill="${body}" stroke="${dark}" stroke-width="2.5" />
      <rect x="0" y="-40" width="52" height="8" rx="4" fill="#ffffff" opacity="0.5" />
      ${windowRect(7, -33)}
      ${windowRect(29, -33)}
      ${wheel(12, 6)}
      ${wheel(40, 6)}
    </g>
  `;
  return `
    <g>
      ${car(-104)}
      ${car(-44)}
      <g transform="translate(16,0)">
        <rect x="0" y="-50" width="58" height="43" rx="11" fill="${body}" stroke="${dark}" stroke-width="2.5" />
        <rect x="8" y="-42" width="22" height="18" rx="5" fill="#ffffff" />
        <circle cx="15" cy="-34" r="2.5" fill="#3a3a3a" />
        <circle cx="24" cy="-34" r="2.5" fill="#3a3a3a" />
        <path d="M 15,-28 Q 19.5,-24.5 24,-28" stroke="#3a3a3a" stroke-width="2" fill="none" stroke-linecap="round" />
        <circle cx="48" cy="-38" r="4.5" fill="#ffe066" />
        <rect x="6" y="-58" width="12" height="10" rx="3" fill="${dark}" />
        ${wheel(12)}
        ${wheel(42)}
      </g>
    </g>
  `;
}

/** 絵本調: みどりのでんしゃ(通勤電車3両) */
function midoriDensha(): string {
  const body = '#59b25c';
  const band = '#c8e6c9';
  const car = (x: number, isLead: boolean): string => `
    <g transform="translate(${x},0)">
      <rect x="0" y="-44" width="62" height="37" rx="${isLead ? 14 : 8}" fill="${body}" stroke="#3e7d41" stroke-width="2.5" />
      <rect x="4" y="-30" width="54" height="9" rx="4" fill="${band}" />
      ${windowRect(8, -40, 14, 12)}
      ${windowRect(26, -40, 14, 12)}
      ${isLead ? `<rect x="44" y="-40" width="13" height="16" rx="4" fill="#e8f7ff" /><circle cx="57" cy="-14" r="4" fill="#ffe066" />` : windowRect(44, -40, 14, 12)}
      ${wheel(14, 6)}
      ${wheel(48, 6)}
    </g>
  `;
  return `<g>${car(-104, false)}${car(-36, false)}${car(32, true)}</g>`;
}

/** 実車寄り: とっきゅう(白い車体+青ライン+とがった先頭) */
function tokkyuu(): string {
  return `
    <g>
      <path d="M -104,-7 L -104,-40 Q -104,-50 -94,-50 L 62,-50 Q 88,-50 102,-20 Q 106,-10 96,-7 Z" fill="#f4f6f8" stroke="#9aa7b0" stroke-width="2.5" />
      <path d="M -104,-24 L 74,-24 Q 88,-24 96,-12 L 98,-9 L -104,-9 Z" fill="#2f6cb0" />
      <rect x="-104" y="-30" width="176" height="5" fill="#e8912d" />
      ${windowRect(-92, -45, 16, 11)}
      ${windowRect(-68, -45, 16, 11)}
      ${windowRect(-44, -45, 16, 11)}
      ${windowRect(-20, -45, 16, 11)}
      ${windowRect(4, -45, 16, 11)}
      <path d="M 58,-46 Q 76,-44 88,-26 L 62,-26 Q 56,-26 56,-32 Z" fill="#2c3e50" />
      <circle cx="94" cy="-14" r="3.5" fill="#ffe066" />
      <line x1="-60" y1="-50" x2="-48" y2="-62" stroke="#5f6b73" stroke-width="2.5" />
      <line x1="-48" y1="-62" x2="-36" y2="-50" stroke="#5f6b73" stroke-width="2.5" />
      ${wheel(-80, 6)}
      ${wheel(-40, 6)}
      ${wheel(20, 6)}
      ${wheel(66, 6)}
    </g>
  `;
}

/** 絵本調: かもつれっしゃ(機関車+コンテナ2両) */
function kamotsu(): string {
  return `
    <g>
      <g transform="translate(-104,0)">
        <rect x="0" y="-13" width="56" height="6" rx="3" fill="#6b4a2f" />
        <rect x="6" y="-38" width="20" height="25" rx="3" fill="#e8912d" stroke="#b56a15" stroke-width="2" />
        <rect x="30" y="-38" width="20" height="25" rx="3" fill="#4a90d9" stroke="#2f6cb0" stroke-width="2" />
        ${wheel(12, 6)}
        ${wheel(44, 6)}
      </g>
      <g transform="translate(-40,0)">
        <rect x="0" y="-13" width="56" height="6" rx="3" fill="#6b4a2f" />
        <rect x="6" y="-38" width="44" height="25" rx="3" fill="#5db39c" stroke="#3d8a76" stroke-width="2" />
        <line x1="28" y1="-38" x2="28" y2="-13" stroke="#3d8a76" stroke-width="2" />
        ${wheel(12, 6)}
        ${wheel(44, 6)}
      </g>
      <g transform="translate(24,0)">
        <rect x="0" y="-50" width="26" height="43" rx="6" fill="#8a5a3b" stroke="#5f3b24" stroke-width="2.5" />
        ${windowRect(5, -44, 14, 12)}
        <rect x="22" y="-36" width="34" height="29" rx="5" fill="#8a5a3b" stroke="#5f3b24" stroke-width="2.5" />
        <rect x="44" y="-50" width="10" height="15" rx="3" fill="#4a4a4a" />
        <circle cx="50" cy="-58" r="5" fill="#cfcfcf" opacity="0.8" />
        <circle cx="56" cy="-64" r="4" fill="#e0e0e0" opacity="0.6" />
        <circle cx="58" cy="-16" r="4" fill="#ffe066" />
        ${wheel(10)}
        ${wheel(44)}
      </g>
    </g>
  `;
}

/** 実車寄り: しんかんせん(白い車体+青帯+ロングノーズ) */
function shinkansen(): string {
  return `
    <g>
      <path d="M -104,-7 L -104,-36 Q -104,-46 -94,-46 L 30,-46 Q 74,-46 100,-14 Q 106,-8 94,-7 Z" fill="#ffffff" stroke="#9aa7b0" stroke-width="2.5" />
      <path d="M -104,-32 L 44,-32 Q 66,-32 84,-16 L 88,-12 L 60,-12 L -104,-12 Z" fill="#2f6cb0" opacity="0.9" />
      ${windowRect(-94, -42, 13, 8)}
      ${windowRect(-74, -42, 13, 8)}
      ${windowRect(-54, -42, 13, 8)}
      ${windowRect(-34, -42, 13, 8)}
      ${windowRect(-14, -42, 13, 8)}
      <path d="M 30,-42 Q 58,-40 76,-24 L 48,-24 Q 40,-24 40,-32 Z" fill="#2c3e50" />
      <rect x="-104" y="-10" width="196" height="4" fill="#c4cdd3" />
      ${wheel(-84, 5)}
      ${wheel(-48, 5)}
      ${wheel(0, 5)}
      ${wheel(52, 5)}
    </g>
  `;
}

/** 絵本調: やこうれっしゃ(よるの色+ひかる窓+星) */
function yakouRessha(): string {
  const body = '#2c3e6b';
  const litWindow = (x: number): string => `<rect x="${x}" y="-38" width="14" height="13" rx="3" fill="#ffe066" />`;
  return `
    <g>
      <g transform="translate(-104,0)">
        <rect x="0" y="-42" width="60" height="35" rx="8" fill="${body}" stroke="#1b2647" stroke-width="2.5" />
        ${litWindow(8)}
        ${litWindow(30)}
        <path d="M 48,-58 l 1.8,4.8 4.8,1.8 -4.8,1.8 -1.8,4.8 -1.8,-4.8 -4.8,-1.8 4.8,-1.8 Z" fill="#ffe066" />
        ${wheel(14, 6)}
        ${wheel(46, 6)}
      </g>
      <g transform="translate(-38,0)">
        <rect x="0" y="-42" width="60" height="35" rx="8" fill="${body}" stroke="#1b2647" stroke-width="2.5" />
        ${litWindow(8)}
        ${litWindow(30)}
        ${wheel(14, 6)}
        ${wheel(46, 6)}
      </g>
      <g transform="translate(28,0)">
        <rect x="0" y="-50" width="64" height="43" rx="11" fill="${body}" stroke="#1b2647" stroke-width="2.5" />
        <path d="M 20,-62 a 9 9 0 1 0 9,12 a 7.5 7.5 0 1 1 -9,-12 Z" fill="#ffe066" />
        ${windowRect(8, -42, 18, 15)}
        <circle cx="54" cy="-38" r="4.5" fill="#ffe066" />
        ${wheel(14)}
        ${wheel(48)}
      </g>
    </g>
  `;
}

/** 実車寄り: きいろいけんそくでんしゃ(ドクターイエロー風) */
function kiiroiDensha(): string {
  return `
    <g>
      <path d="M -104,-7 L -104,-36 Q -104,-46 -94,-46 L 30,-46 Q 74,-46 100,-14 Q 106,-8 94,-7 Z" fill="#f5c542" stroke="#c79a1a" stroke-width="2.5" />
      <path d="M -104,-30 L 48,-30 Q 68,-30 84,-16 L 87,-13 L -104,-13 Z" fill="#2f6cb0" />
      ${windowRect(-92, -42, 13, 8)}
      ${windowRect(-70, -42, 13, 8)}
      ${windowRect(-26, -42, 13, 8)}
      ${windowRect(-4, -42, 13, 8)}
      <path d="M 30,-42 Q 58,-40 76,-24 L 48,-24 Q 40,-24 40,-32 Z" fill="#2c3e50" />
      <rect x="-104" y="-10" width="196" height="4" fill="#c4cdd3" />
      ${wheel(-84, 5)}
      ${wheel(-48, 5)}
      ${wheel(0, 5)}
      ${wheel(52, 5)}
    </g>
  `;
}

/** ごほうび: きんのでんしゃ(きらきら) */
function kinNoDensha(): string {
  const body = '#f0c34e';
  const edge = '#c79417';
  const sparkle = (x: number, y: number, s: number): string =>
    `<path d="M ${x},${y - s} l ${(s * 0.3).toFixed(1)},${(s * 0.7).toFixed(1)} ${(s * 0.7).toFixed(1)},${(s * 0.3).toFixed(1)} -${(s * 0.7).toFixed(1)},${(s * 0.3).toFixed(1)} -${(s * 0.3).toFixed(1)},${(s * 0.7).toFixed(1)} -${(s * 0.3).toFixed(1)},-${(s * 0.7).toFixed(1)} -${(s * 0.7).toFixed(1)},-${(s * 0.3).toFixed(1)} ${(s * 0.7).toFixed(1)},-${(s * 0.3).toFixed(1)} Z" fill="#fff3c4" />`;
  const car = (x: number): string => `
    <g transform="translate(${x},0)">
      <rect x="0" y="-42" width="58" height="35" rx="9" fill="${body}" stroke="${edge}" stroke-width="2.5" />
      <rect x="0" y="-42" width="58" height="8" rx="4" fill="#fff3c4" />
      ${windowRect(8, -32, 16, 14)}
      ${windowRect(34, -32, 16, 14)}
      ${wheel(14, 6)}
      ${wheel(44, 6)}
    </g>
  `;
  return `
    <g>
      ${car(-100)}
      ${car(-34)}
      <g transform="translate(32,0)">
        <rect x="0" y="-52" width="62" height="45" rx="12" fill="${body}" stroke="${edge}" stroke-width="2.5" />
        <path d="M 10,-52 L 14,-62 L 20,-54 L 26,-64 L 32,-54 L 38,-62 L 42,-52 Z" fill="${edge}" />
        <rect x="10" y="-44" width="22" height="18" rx="5" fill="#ffffff" />
        <circle cx="17" cy="-36" r="2.5" fill="#3a3a3a" />
        <circle cx="26" cy="-36" r="2.5" fill="#3a3a3a" />
        <path d="M 17,-30 Q 21.5,-26.5 26,-30" stroke="#3a3a3a" stroke-width="2" fill="none" stroke-linecap="round" />
        <circle cx="52" cy="-40" r="4.5" fill="#ffffff" />
        ${wheel(14)}
        ${wheel(46)}
      </g>
      ${sparkle(-70, -56, 6)}
      ${sparkle(0, -60, 5)}
      ${sparkle(78, -66, 7)}
    </g>
  `;
}

const TRAIN_ART: Record<string, (opts: TrainArtOptions) => string> = {
  'akai-densha': (opts) => akaiDensha(opts.bodyColor ?? '#e24b4a'),
  'midori-densha': () => midoriDensha(),
  tokkyuu: () => tokkyuu(),
  kamotsu: () => kamotsu(),
  shinkansen: () => shinkansen(),
  'yakou-ressha': () => yakouRessha(),
  'kiiroi-densha': () => kiiroiDensha(),
  'kin-no-densha': () => kinNoDensha(),
};

/**
 * 車両アートを返す。未知のIDは初期車両(あかいでんしゃ)にフォールバック。
 * 返り値は線路上面y0・中心x0に正規化されたSVG断片。
 */
export function trainArtSvg(trainId: string, opts: TrainArtOptions = {}): string {
  const build = TRAIN_ART[trainId] ?? TRAIN_ART['akai-densha'];
  return build(opts);
}

/** 一覧カードなどで単体表示する用: <svg>で包んで返す */
export function trainArtStandaloneSvg(trainId: string, opts: TrainArtOptions = {}): string {
  return `
    <svg viewBox="-118 -80 236 92" width="100%" aria-hidden="true">
      ${trainArtSvg(trainId, opts)}
    </svg>
  `;
}
