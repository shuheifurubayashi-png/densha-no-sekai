import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { loadProgress, saveProgress } from '../lib/storage';
import { STATIONS } from '../data/content';
import type { ScreenName } from '../lib/types';

const STATION_GAP_X = 280;
const STATION_Y = 220;
const MAP_PADDING_X = 140;
const VIEWBOX_HEIGHT = 360;
const TRAIN_TRAVEL_MS = 3600;

const MAP_STYLE_ID = 'map-screen-style';

function ensureMapStyle(): void {
  if (document.getElementById(MAP_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = MAP_STYLE_ID;
  style.textContent = `
    .screen-map {
      position: relative;
      justify-content: flex-start;
      padding: 0;
      gap: 0;
      overflow: hidden;
    }

    .map-title {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: clamp(20px, 5vw, 32px);
      color: #ffffff;
      text-shadow: 2px 2px 0 #4a90d9;
      margin: 0;
      z-index: 5;
      pointer-events: none;
    }

    .map-scroll {
      width: 100%;
      height: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      display: flex;
      align-items: center;
      scroll-behavior: smooth;
    }

    .map-svg {
      height: 100%;
      display: block;
    }

    .map-stamps-button {
      position: absolute;
      top: 12px;
      right: 12px;
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .map-stamps-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .map-station-group {
      cursor: pointer;
    }

    .map-station-group.is-next .map-station-circle {
      animation: map-station-glow 1s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }

    .map-station-group.is-next .map-station-wrapper {
      animation: map-station-wiggle 1s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }

    .map-station-group.is-disabled {
      pointer-events: none;
    }

    @keyframes map-station-glow {
      0%, 100% { filter: drop-shadow(0 0 0px #ffe066); }
      50% { filter: drop-shadow(0 0 14px #ffe066); }
    }

    @keyframes map-station-wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-4deg); }
      75% { transform: rotate(4deg); }
    }

    .map-train-group {
      cursor: pointer;
      transition: transform ${TRAIN_TRAVEL_MS}ms linear;
    }

    .map-train-group.is-disabled {
      pointer-events: none;
    }

    .map-wheel {
      transform-origin: center;
      transform-box: fill-box;
    }

    .map-train-group.is-running .map-wheel {
      animation: map-wheel-spin 0.4s linear infinite;
    }

    @keyframes map-wheel-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .map-crossing-light {
      opacity: 0.3;
    }

    .map-crossing.is-active .map-crossing-light-a {
      animation: map-crossing-blink 0.5s steps(1) infinite;
    }

    .map-crossing.is-active .map-crossing-light-b {
      animation: map-crossing-blink 0.5s steps(1) infinite 0.25s;
    }

    @keyframes map-crossing-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0.25; }
    }

    .map-crossing-gate {
      transform-origin: 0px 0px;
      transition: transform 0.6s ease;
    }

    .map-crossing.is-active .map-crossing-gate {
      transform: rotate(75deg);
    }
  `;
  document.head.appendChild(style);
}

function buildRailPath(stationCount: number): string {
  const points: string[] = [];
  for (let i = 0; i < stationCount; i += 1) {
    const x = MAP_PADDING_X + i * STATION_GAP_X;
    points.push(`${x},${STATION_Y}`);
  }
  return `M ${points.join(' L ')}`;
}

function buildSleepers(stationCount: number): string {
  const totalWidth = MAP_PADDING_X * 2 + (stationCount - 1) * STATION_GAP_X;
  const sleeperGap = 24;
  let sleepers = '';
  for (let x = 20; x < totalWidth - 20; x += sleeperGap) {
    sleepers += `<rect x="${x - 6}" y="${STATION_Y - 22}" width="12" height="44" rx="3" fill="#a97c50" />`;
  }
  return sleepers;
}

function trainSvg(): string {
  return `
    <g class="map-train-group" data-train>
      <g transform="translate(-40,-34)">
        <!-- 客車2両 -->
        <g transform="translate(-58,10)">
          <rect x="0" y="0" width="46" height="30" rx="8" fill="#ffd93d" stroke="#e0b800" stroke-width="2" />
          <circle class="map-wheel" cx="10" cy="30" r="6" fill="#3a3a3a" />
          <circle class="map-wheel" cx="36" cy="30" r="6" fill="#3a3a3a" />
          <rect x="6" y="6" width="12" height="12" rx="2" fill="#bfe8ff" />
          <rect x="24" y="6" width="12" height="12" rx="2" fill="#bfe8ff" />
        </g>
        <g transform="translate(-6,10)">
          <rect x="0" y="0" width="46" height="30" rx="8" fill="#ff9f43" stroke="#e0821f" stroke-width="2" />
          <circle class="map-wheel" cx="10" cy="30" r="6" fill="#3a3a3a" />
          <circle class="map-wheel" cx="36" cy="30" r="6" fill="#3a3a3a" />
          <rect x="6" y="6" width="12" height="12" rx="2" fill="#bfe8ff" />
          <rect x="24" y="6" width="12" height="12" rx="2" fill="#bfe8ff" />
        </g>
        <!-- 先頭車両 -->
        <g transform="translate(46,0)">
          <rect x="0" y="0" width="48" height="40" rx="10" fill="#4a90d9" stroke="#2f6cb0" stroke-width="2" />
          <rect x="8" y="8" width="16" height="14" rx="3" fill="#e8f7ff" />
          <circle cx="40" cy="12" r="4" fill="#ffe066" />
          <circle class="map-wheel" cx="10" cy="40" r="7" fill="#3a3a3a" />
          <circle class="map-wheel" cx="34" cy="40" r="7" fill="#3a3a3a" />
        </g>
      </g>
    </g>
  `;
}

function crossingSvg(x: number): string {
  return `
    <g class="map-crossing" data-crossing data-x="${x}" transform="translate(${x},${STATION_Y})">
      <rect x="-8" y="-46" width="16" height="16" rx="4" fill="#ffffff" stroke="#333" stroke-width="2" />
      <circle class="map-crossing-light map-crossing-light-a" cx="-3" cy="-38" r="3" fill="#ff4d4d" />
      <circle class="map-crossing-light map-crossing-light-b" cx="5" cy="-38" r="3" fill="#ff4d4d" />
      <line x1="0" y1="-30" x2="0" y2="-4" stroke="#666" stroke-width="4" />
      <g class="map-crossing-gate" transform="translate(0,-30)">
        <rect x="0" y="-3" width="34" height="6" rx="3" fill="#ffcc00" />
        <rect x="0" y="-3" width="10" height="6" fill="#e02020" />
        <rect x="20" y="-3" width="10" height="6" fill="#e02020" />
      </g>
    </g>
  `;
}

export function renderMapScreen(root: HTMLElement): void {
  ensureMapStyle();

  const progress = loadProgress();
  const currentStation = Math.min(progress.currentStation, STATIONS.length - 1);
  const stationCount = STATIONS.length;
  const totalWidth = MAP_PADDING_X * 2 + (stationCount - 1) * STATION_GAP_X;

  const stationsSvg = STATIONS.map((station, index) => {
    const x = MAP_PADDING_X + index * STATION_GAP_X;
    const isCleared = index < currentStation;
    const isNext = index === currentStation + 1;
    const classNames = ['map-station-group'];
    if (isNext) classNames.push('is-next');
    return `
      <g class="${classNames.join(' ')}" data-station data-index="${index}" transform="translate(${x},${STATION_Y})">
        <g class="map-station-wrapper">
          <circle class="map-station-circle" r="46" fill="#ffffff" stroke="#4a90d9" stroke-width="5" />
          <text x="0" y="-4" text-anchor="middle" font-size="34">${station.emoji}</text>
          ${isCleared ? '<text x="30" y="-34" text-anchor="middle" font-size="26">⭐</text>' : ''}
        </g>
        <text x="0" y="78" text-anchor="middle" font-size="20" fill="#2b4a63">${station.name}</text>
      </g>
    `;
  }).join('');

  const crossingsSvg = STATIONS.slice(0, -1).map((_, index) => {
    const x = MAP_PADDING_X + index * STATION_GAP_X + STATION_GAP_X / 2;
    return crossingSvg(x);
  }).join('');

  const initialTrainX = MAP_PADDING_X + currentStation * STATION_GAP_X;

  root.innerHTML = `
    <div class="screen screen-map">
      <h1 class="map-title">🗺️ ろせんず</h1>
      <button class="map-stamps-button" data-stamps aria-label="すたんぷちょう">📖</button>
      <div class="map-scroll" data-scroll>
        <svg class="map-svg" data-svg viewBox="0 0 ${totalWidth} ${VIEWBOX_HEIGHT}" width="${totalWidth}" height="${VIEWBOX_HEIGHT}">
          <rect x="0" y="0" width="${totalWidth}" height="${VIEWBOX_HEIGHT}" fill="#87ceeb" />
          <path d="M0,${VIEWBOX_HEIGHT} Q ${totalWidth * 0.2},${VIEWBOX_HEIGHT - 120} ${totalWidth * 0.4},${VIEWBOX_HEIGHT - 60} T ${totalWidth},${VIEWBOX_HEIGHT - 90} L ${totalWidth},${VIEWBOX_HEIGHT} Z" fill="#8bc34a" />
          <path d="${buildRailPath(stationCount)}" stroke="#8a8a8a" stroke-width="6" fill="none" />
          ${buildSleepers(stationCount)}
          ${crossingsSvg}
          ${stationsSvg}
          <g data-train-anchor transform="translate(${initialTrainX},${STATION_Y})">
            ${trainSvg()}
          </g>
        </svg>
      </div>
    </div>
  `;

  root.querySelector('[data-stamps]')?.addEventListener('click', () => {
    audioManager.play('sfx-tap');
    showScreen('stamps');
  });

  let isAnimating = false;
  const trainAnchor = root.querySelector<SVGGElement>('[data-train-anchor]');
  const trainGroup = root.querySelector<SVGGElement>('[data-train]');
  const scrollContainer = root.querySelector<HTMLDivElement>('[data-scroll]');

  scrollToStation(scrollContainer, currentStation);

  function scrollToStation(container: HTMLDivElement | null, index: number): void {
    if (!container) return;
    const targetX = MAP_PADDING_X + index * STATION_GAP_X;
    const scale = container.clientHeight / VIEWBOX_HEIGHT;
    const targetLeft = targetX * scale - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(targetLeft, 0), behavior: 'auto' });
  }

  function setInputEnabled(enabled: boolean): void {
    trainGroup?.classList.toggle('is-disabled', !enabled);
    root.querySelectorAll('[data-station]').forEach((element) => {
      element.classList.toggle('is-disabled', !enabled);
    });
  }

  function goToNextStation(): void {
    if (isAnimating) return;
    const nextIndex = currentStation + 1;
    if (nextIndex >= STATIONS.length) return;
    isAnimating = true;
    setInputEnabled(false);

    void runDepartureSequence(nextIndex);
  }

  async function runDepartureSequence(nextIndex: number): Promise<void> {
    audioManager.play('sfx-whistle');
    await audioManager.playVoice('departure');

    if (!trainAnchor || !trainGroup) {
      finishArrival(nextIndex);
      return;
    }

    trainGroup.classList.add('is-running');

    const fromX = MAP_PADDING_X + (nextIndex - 1) * STATION_GAP_X;
    const toX = MAP_PADDING_X + nextIndex * STATION_GAP_X;
    const crossingX = (fromX + toX) / 2;
    const crossingElement = root.querySelector<SVGGElement>(
      `[data-crossing][data-x="${crossingX}"]`,
    );

    // 電車を出発させる
    trainAnchor.style.transform = `translateX(${toX - fromX}px)`;

    const halfwayDelay = TRAIN_TRAVEL_MS * 0.4;
    const crossingCloseDuration = 900;

    window.setTimeout(() => {
      crossingElement?.classList.add('is-active');
      audioManager.play('sfx-kankan');
      audioManager.playVoice('crossing');
    }, Math.max(halfwayDelay - crossingCloseDuration, 0));

    window.setTimeout(() => {
      crossingElement?.classList.remove('is-active');
    }, halfwayDelay + crossingCloseDuration);

    await wait(TRAIN_TRAVEL_MS);

    trainGroup.classList.remove('is-running');
    finishArrival(nextIndex);
  }

  async function finishArrival(nextIndex: number): Promise<void> {
    await audioManager.playVoice('arrive');

    const newProgress = loadProgress();
    newProgress.currentStation = nextIndex;
    saveProgress(newProgress);

    const station = STATIONS[nextIndex];
    showScreen(station.type as ScreenName);
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  trainGroup?.addEventListener('click', goToNextStation);

  root.querySelectorAll<SVGGElement>('[data-station]').forEach((element) => {
    element.addEventListener('click', () => {
      const index = Number(element.dataset.index);
      if (index === currentStation + 1) {
        goToNextStation();
      }
    });
  });
}
