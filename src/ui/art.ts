/**
 * 絵本風の風景・建物SVGパーツ集。
 * すべて文字列としてSVG断片を返す純関数。map.ts などから合成して使う。
 */

export const PALETTE = {
  skyTop: '#b7e5f8',
  skyLow: '#e6f6fd',
  sun: '#ffd166',
  sunRay: '#ffe08a',
  cloud: '#ffffff',
  hillNear: '#a8d977',
  hillFar: '#c4e59a',
  mountainFar: '#8fcfbd',
  mountainNear: '#5db39c',
  snow: '#ffffff',
  sea: '#7fd0e8',
  wave: '#ffffff',
  trunk: '#a97c50',
  leaf: '#6fbf5a',
  leafLight: '#8fd177',
  rail: '#8a7a6a',
  sleeper: '#b58a5c',
  stationBody: '#fff6e0',
  stationEdge: '#e8d9bd',
  platform: '#cfc4b4',
  text: '#2b4a63',
} as const;

/** 駅タイプごとの屋根色とシンボル */
const STATION_THEME: Record<string, { roof: string; symbol: string }> = {
  hiragana: { roof: '#ff8b71', symbol: '<text x="0" y="-58" text-anchor="middle" font-size="40" font-weight="bold" fill="#d85a30">あ</text>' },
  kazu: { roof: '#f5a623', symbol: '<text x="0" y="-58" text-anchor="middle" font-size="30" font-weight="bold" fill="#ba7517">１２３</text>' },
  kotoba: {
    roof: '#3fb8af',
    symbol: `
      <g transform="translate(0,-70)">
        <path d="M -24,-14 h 48 a 8 8 0 0 1 8 8 v 14 a 8 8 0 0 1 -8 8 h -26 l -10 10 v -10 h -12 a 8 8 0 0 1 -8 -8 v -14 a 8 8 0 0 1 8 -8 Z" fill="#3fb8af" />
        <circle cx="-12" cy="1" r="3.5" fill="#ffffff" /><circle cx="0" cy="1" r="3.5" fill="#ffffff" /><circle cx="12" cy="1" r="3.5" fill="#ffffff" />
      </g>`,
  },
  iro: {
    roof: '#b48be0',
    symbol: `
      <g transform="translate(0,-68)">
        <circle cx="-16" cy="0" r="9" fill="#e24b4a" /><circle cx="0" cy="-8" r="9" fill="#f5a623" /><circle cx="16" cy="0" r="9" fill="#4a90d9" />
      </g>`,
  },
  oto: {
    roof: '#6aa8e8',
    symbol: `
      <g transform="translate(0,-68)" fill="#2f6cb0">
        <path d="M -10,10 v -22 l 22,-6 v 22" stroke="#2f6cb0" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="-10" cy="10" r="6" /><circle cx="12" cy="4" r="6" />
      </g>`,
  },
  katachi: {
    roof: '#9b7fd4',
    symbol: `
      <g transform="translate(0,-68)">
        <circle cx="-18" cy="0" r="8" fill="#e24b4a" />
        <polygon points="0,-10 8,4 -8,4" fill="#59b25c" />
        <rect x="10" y="-6" width="14" height="14" rx="2" fill="#4a90d9" />
      </g>`,
  },
  kisekae: {
    roof: '#f0a8c4',
    symbol: `
      <g transform="translate(0,-68)">
        <path d="M -18,-10 L -2,0 L -18,10 Z" fill="#e85d9c" />
        <path d="M 18,-10 L 2,0 L 18,10 Z" fill="#e85d9c" />
        <circle cx="0" cy="0" r="5" fill="#ba3d78" />
      </g>`,
  },
};

/** ゴール駅(しゅうてん)用テーマ */
const GOAL_THEME = {
  roof: '#ffd166',
  symbol: `
    <g transform="translate(0,-68)">
      <path d="M -20,10 L -20,-16 L 20,-16 L 20,10" stroke="#ba7517" stroke-width="4" fill="none" stroke-linecap="round" />
      <circle cx="0" cy="-2" r="12" fill="#ffd166" stroke="#ba7517" stroke-width="3" />
    </g>`,
};

/** 5角星のパス(半径r、中心0,0) */
export function starPath(r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(Math.cos(angle) * radius).toFixed(1)},${(Math.sin(angle) * radius).toFixed(1)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

export function sunSvg(x: number, y: number): string {
  let rays = '';
  for (let i = 0; i < 8; i += 1) {
    const angle = (i * Math.PI) / 4;
    const x1 = Math.cos(angle) * 34;
    const y1 = Math.sin(angle) * 34;
    const x2 = Math.cos(angle) * 46;
    const y2 = Math.sin(angle) * 46;
    rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${PALETTE.sunRay}" stroke-width="7" stroke-linecap="round" />`;
  }
  return `
    <g transform="translate(${x},${y})">
      ${rays}
      <circle r="28" fill="${PALETTE.sun}" />
    </g>
  `;
}

export function cloudSvg(x: number, y: number, scale = 1): string {
  return `
    <g transform="translate(${x},${y}) scale(${scale})" fill="${PALETTE.cloud}" opacity="0.95">
      <ellipse cx="0" cy="0" rx="34" ry="16" />
      <ellipse cx="24" cy="-8" rx="24" ry="14" />
      <ellipse cx="-26" cy="-4" rx="20" ry="12" />
    </g>
  `;
}

/** 山なみ(雪帽子つき)。cx中心、baseYが山のふもと */
export function mountainsSvg(cx: number, baseY: number): string {
  return `
    <g>
      <path d="M ${cx - 210},${baseY} L ${cx - 90},${baseY - 130} L ${cx + 30},${baseY} Z" fill="${PALETTE.mountainFar}" />
      <path d="M ${cx - 40},${baseY} L ${cx + 80},${baseY - 170} L ${cx + 200},${baseY} Z" fill="${PALETTE.mountainNear}" />
      <path d="M ${cx + 52},${baseY - 130} L ${cx + 80},${baseY - 170} L ${cx + 108},${baseY - 130} Q ${cx + 94},${baseY - 118} ${cx + 80},${baseY - 128} Q ${cx + 66},${baseY - 118} ${cx + 52},${baseY - 130} Z" fill="${PALETTE.snow}" />
    </g>
  `;
}

/** 海と小舟。cx中心、yが水面 */
export function seaSvg(cx: number, y: number): string {
  let waves = '';
  for (let i = -3; i <= 3; i += 1) {
    waves += `<path d="M ${cx + i * 70 - 22},${y + 26} q 11,-10 22,0 q 11,10 22,0" stroke="${PALETTE.wave}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8" />`;
  }
  return `
    <g>
      <rect x="${cx - 250}" y="${y}" width="500" height="60" rx="18" fill="${PALETTE.sea}" />
      ${waves}
      <g transform="translate(${cx - 40},${y - 4})">
        <path d="M -34,0 L 34,0 L 20,18 L -20,18 Z" fill="#d85a30" />
        <line x1="0" y1="0" x2="0" y2="-34" stroke="${PALETTE.trunk}" stroke-width="4" />
        <path d="M 0,-34 L 26,-8 L 0,-8 Z" fill="#ffffff" />
      </g>
    </g>
  `;
}

/** 木(まるい葉っぱ2段) */
export function treeSvg(x: number, baseY: number, scale = 1): string {
  return `
    <g transform="translate(${x},${baseY}) scale(${scale})">
      <rect x="-6" y="-30" width="12" height="30" rx="4" fill="${PALETTE.trunk}" />
      <circle cx="0" cy="-48" r="26" fill="${PALETTE.leaf}" />
      <circle cx="-18" cy="-34" r="16" fill="${PALETTE.leafLight}" />
      <circle cx="18" cy="-34" r="16" fill="${PALETTE.leafLight}" />
    </g>
  `;
}

/** 小さな花(ぽんぽん) */
export function flowerSvg(x: number, y: number, color: string): string {
  return `
    <g transform="translate(${x},${y})">
      <line x1="0" y1="0" x2="0" y2="-10" stroke="${PALETTE.leaf}" stroke-width="3" />
      <circle cy="-14" r="6" fill="${color}" />
    </g>
  `;
}

/**
 * 駅舎。原点=駅の線路上の中心点。線路の上に建つ。
 * glowアニメ用に本体rectへ map-station-circle クラスを付ける。
 */
export function stationBuildingSvg(type: string, isGoal: boolean): string {
  const theme = isGoal ? GOAL_THEME : STATION_THEME[type] ?? STATION_THEME.kotoba;
  const flag = isGoal
    ? `
      <g transform="translate(0,-176)">
        <line x1="0" y1="0" x2="0" y2="34" stroke="#8a7a6a" stroke-width="4" />
        <path d="M 0,0 L 34,9 L 0,18 Z" fill="#e24b4a" />
      </g>`
    : '';
  return `
    <g class="map-station-building">
      <rect x="-84" y="-16" width="168" height="16" rx="5" fill="${PALETTE.platform}" />
      <rect class="map-station-circle" x="-62" y="-108" width="124" height="92" rx="12" fill="${PALETTE.stationBody}" stroke="${PALETTE.stationEdge}" stroke-width="4" />
      <path d="M -78,-104 L 0,-146 L 78,-104 Q 40,-116 0,-116 Q -40,-116 -78,-104 Z" fill="${theme.roof}" />
      ${flag}
      <rect x="-16" y="-52" width="32" height="36" rx="7" fill="${theme.roof}" opacity="0.55" />
      <rect x="-50" y="-48" width="20" height="18" rx="4" fill="#bfe8ff" />
      <rect x="30" y="-48" width="20" height="18" rx="4" fill="#bfe8ff" />
      ${theme.symbol}
    </g>
  `;
}

/** クリア済みマーク(きんいろの星) */
export function clearedStarSvg(x: number, y: number): string {
  return `
    <g transform="translate(${x},${y})">
      <path d="${starPath(20)}" fill="#ffd166" stroke="#f5a623" stroke-width="3" stroke-linejoin="round" />
    </g>
  `;
}

/**
 * 区間シーナリー。駅iと駅i+1の間の風景をインデックスで変化させる。
 * cx: 区間の中央x、groundY: 地面ライン(線路y)。
 */
export function segmentScenerySvg(index: number, cx: number, groundY: number): string {
  const kind = index % 4;
  if (kind === 0) {
    return `
      ${treeSvg(cx - 120, groundY - 44, 1.1)}
      ${treeSvg(cx + 90, groundY - 40, 0.85)}
      ${flowerSvg(cx - 30, groundY - 36, '#ff8b71')}
      ${flowerSvg(cx + 20, groundY - 30, '#f5a623')}
    `;
  }
  if (kind === 1) {
    return mountainsSvg(cx, groundY - 60);
  }
  if (kind === 2) {
    return seaSvg(cx, groundY - 120);
  }
  return `
    ${treeSvg(cx - 60, groundY - 46, 1.2)}
    ${treeSvg(cx + 40, groundY - 40, 1)}
    ${treeSvg(cx + 130, groundY - 36, 0.7)}
    ${flowerSvg(cx - 130, groundY - 32, '#e97fb2')}
  `;
}

/** 地面(なだらかな丘をずらして重ねる)。totalWidth全体分を返す */
export function groundSvg(totalWidth: number, groundY: number, viewboxHeight: number): string {
  let hills = '';
  for (let x = -200; x < totalWidth + 200; x += 460) {
    hills += `<ellipse cx="${x}" cy="${groundY + 96}" rx="330" ry="120" fill="${PALETTE.hillFar}" />`;
  }
  for (let x = 60; x < totalWidth + 200; x += 520) {
    hills += `<ellipse cx="${x}" cy="${groundY + 130}" rx="360" ry="130" fill="${PALETTE.hillNear}" />`;
  }
  return `
    <g>
      ${hills}
      <rect x="0" y="${groundY + 60}" width="${totalWidth}" height="${Math.max(viewboxHeight - groundY - 60, 0)}" fill="${PALETTE.hillNear}" />
    </g>
  `;
}

/** 空(上下2トーン + 太陽 + 雲を等間隔に) */
export function skySvg(totalWidth: number, viewboxHeight: number): string {
  let clouds = '';
  for (let i = 0; i < Math.ceil(totalWidth / 420); i += 1) {
    const x = 180 + i * 420;
    const y = 60 + (i % 3) * 34;
    const scale = 0.8 + (i % 2) * 0.4;
    clouds += cloudSvg(x, y, scale);
  }
  return `
    <rect x="0" y="0" width="${totalWidth}" height="${viewboxHeight}" fill="${PALETTE.skyTop}" />
    <rect x="0" y="${Math.round(viewboxHeight * 0.42)}" width="${totalWidth}" height="${Math.round(viewboxHeight * 0.58)}" fill="${PALETTE.skyLow}" />
    ${sunSvg(240, 96)}
    ${clouds}
  `;
}

/** 改札機2台(通路が開いた状態)。ことばカード「かいさつ」用の単体表示SVG */
export function kaisatsuArtSvg(): string {
  const gate = (x: number): string => `
    <g transform="translate(${x},0)">
      <rect x="0" y="-52" width="28" height="52" rx="10" fill="#e8912d" stroke="#b56a15" stroke-width="3" />
      <rect x="5" y="-46" width="18" height="14" rx="4" fill="#bfe8ff" />
      <circle cx="14" cy="-16" r="5" fill="#59b25c" />
    </g>
  `;
  const flap = (x: number, rotate: number): string => `
    <rect x="${x - 2.5}" y="-38" width="5" height="24" rx="2.5" fill="#5f6b73" transform="rotate(${rotate} ${x} -38)" />
  `;
  return `
    <svg viewBox="-64 -60 128 66" aria-hidden="true">
      <rect x="-64" y="0" width="128" height="6" rx="3" fill="#cfc4b4" />
      ${gate(-64)}
      ${flap(-30, 70)}
      ${flap(28, -70)}
      ${gate(36)}
    </svg>
  `;
}

/** スタンプ帳ボタン用の本アイコン */
export function bookIconSvg(): string {
  return `
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <path d="M 24 10 C 18 5 10 5 6 7 v 30 c 4 -2 12 -2 18 3 c 6 -5 14 -5 18 -3 V 7 c -4 -2 -12 -2 -18 3 Z" fill="#fff6e0" stroke="#d85a30" stroke-width="3" stroke-linejoin="round" />
      <line x1="24" y1="10" x2="24" y2="40" stroke="#d85a30" stroke-width="3" />
      <path d="${starPath(6)}" transform="translate(15,24)" fill="#ffd166" />
      <path d="${starPath(6)}" transform="translate(33,24)" fill="#3fb8af" />
    </svg>
  `;
}
