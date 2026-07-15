import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { loadProgress, saveProgress } from '../lib/storage';
import { setReplayMode } from '../lib/quiz';
import { STATIONS } from '../data/content';
import type { ScreenName } from '../lib/types';
import {
  PALETTE,
  skySvg,
  groundSvg,
  segmentScenerySvg,
  stationBuildingSvg,
  clearedStarSvg,
  bookIconSvg,
} from '../ui/art';
import { trainArtSvg, trainArtStandaloneSvg } from '../ui/trainArt';

const STATION_GAP_X = 400;
const STATION_Y = 380;
const MAP_PADDING_X = 200;
const VIEWBOX_HEIGHT = 520;
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
      text-shadow: 2px 2px 0 #3fb8af;
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
      width: auto;
      flex-shrink: 0;
      display: block;
    }

    .map-stamps-button,
    .map-shako-button {
      position: absolute;
      top: 12px;
      right: 12px;
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .map-shako-button {
      top: 108px;
    }

    .map-stamps-button:active,
    .map-shako-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .map-stamps-button.is-disabled,
    .map-shako-button.is-disabled {
      pointer-events: none;
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
      25% { transform: rotate(-2deg); }
      75% { transform: rotate(2deg); }
    }

    .map-train-anchor {
      transition: transform ${TRAIN_TRAVEL_MS}ms linear;
    }

    .map-train-group {
      cursor: pointer;
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
  const sleeperGap = 30;
  let sleepers = '';
  for (let x = 24; x < totalWidth - 24; x += sleeperGap) {
    sleepers += `<rect x="${x - 7}" y="${STATION_Y - 26}" width="14" height="52" rx="4" fill="${PALETTE.sleeper}" />`;
  }
  return sleepers;
}

function trainShellSvg(art: string): string {
  return `
    <g class="map-train-group" data-train>
      <g transform="scale(1.5)">
        ${art}
      </g>
    </g>
  `;
}

function crossingSvg(x: number): string {
  return `
    <g class="map-crossing" data-crossing data-x="${x}" transform="translate(${x},${STATION_Y}) scale(1.5)">
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
  setReplayMode(false);

  const progress = loadProgress();
  const currentStation = Math.min(progress.currentStation, STATIONS.length - 1);
  const stationCount = STATIONS.length;
  const totalWidth = MAP_PADDING_X * 2 + (stationCount - 1) * STATION_GAP_X;

  const stationsSvg = STATIONS.map((station, index) => {
    const x = MAP_PADDING_X + index * STATION_GAP_X;
    const isCleared = index < currentStation;
    const isNext = index === currentStation + 1;
    const isGoal = index === stationCount - 1;
    const classNames = ['map-station-group'];
    if (isNext) classNames.push('is-next');
    return `
      <g class="${classNames.join(' ')}" data-station data-index="${index}" transform="translate(${x},${STATION_Y})">
        <g class="map-station-wrapper">
          ${stationBuildingSvg(station.type, isGoal)}
          ${isCleared ? clearedStarSvg(58, -132) : ''}
        </g>
        <text x="0" y="70" text-anchor="middle" font-size="30" font-weight="bold" fill="${PALETTE.text}" stroke="#ffffff" stroke-width="6" paint-order="stroke">${station.name}</text>
      </g>
    `;
  }).join('');

  const scenerySvg = STATIONS.slice(0, -1).map((_, index) => {
    const cx = MAP_PADDING_X + index * STATION_GAP_X + STATION_GAP_X / 2;
    return segmentScenerySvg(index, cx, STATION_Y);
  }).join('');

  const crossingsSvg = STATIONS.slice(0, -1).map((_, index) => {
    const x = MAP_PADDING_X + index * STATION_GAP_X + STATION_GAP_X / 2;
    return crossingSvg(x);
  }).join('');

  const initialTrainX = MAP_PADDING_X + currentStation * STATION_GAP_X;

  root.innerHTML = `
    <div class="screen screen-map">
      <h1 class="map-title">ろせんず</h1>
      <button class="map-stamps-button" data-stamps aria-label="すたんぷちょう">${bookIconSvg()}</button>
      <button class="map-shako-button" data-shako aria-label="しゃこ">
        <div style="width: 56px;">${trainArtStandaloneSvg(progress.selectedTrain)}</div>
      </button>
      <div class="map-scroll" data-scroll>
        <svg class="map-svg" data-svg viewBox="0 0 ${totalWidth} ${VIEWBOX_HEIGHT}" style="aspect-ratio: ${totalWidth} / ${VIEWBOX_HEIGHT};">
          ${skySvg(totalWidth, VIEWBOX_HEIGHT)}
          ${groundSvg(totalWidth, STATION_Y, VIEWBOX_HEIGHT)}
          ${scenerySvg}
          <path d="${buildRailPath(stationCount)}" stroke="${PALETTE.rail}" stroke-width="8" fill="none" />
          ${buildSleepers(stationCount)}
          ${crossingsSvg}
          ${stationsSvg}
          <g class="map-train-anchor" data-train-anchor transform="translate(${initialTrainX},${STATION_Y})">
            ${trainShellSvg(trainArtSvg(progress.selectedTrain))}
          </g>
        </svg>
      </div>
    </div>
  `;

  root.querySelector('[data-stamps]')?.addEventListener('click', () => {
    audioManager.play('sfx-tap');
    showScreen('stamps');
  });

  root.querySelector('[data-shako]')?.addEventListener('click', () => {
    audioManager.play('sfx-tap');
    showScreen('shako');
  });

  let isAnimating = false;
  const trainAnchor = root.querySelector<SVGGElement>('[data-train-anchor]');
  const trainGroup = root.querySelector<SVGGElement>('[data-train]');
  const scrollContainer = root.querySelector<HTMLDivElement>('[data-scroll]');

  scrollToStation(scrollContainer, currentStation, 'auto');

  function scrollToStation(container: HTMLDivElement | null, index: number, behavior: ScrollBehavior): void {
    if (!container) return;
    const targetX = MAP_PADDING_X + index * STATION_GAP_X;
    const scale = container.clientHeight / VIEWBOX_HEIGHT;
    const targetLeft = targetX * scale - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(targetLeft, 0), behavior });
  }

  function setInputEnabled(enabled: boolean): void {
    trainGroup?.classList.toggle('is-disabled', !enabled);
    root.querySelectorAll('[data-station]').forEach((element) => {
      element.classList.toggle('is-disabled', !enabled);
    });
    root.querySelector('[data-stamps]')?.classList.toggle('is-disabled', !enabled);
    root.querySelector('[data-shako]')?.classList.toggle('is-disabled', !enabled);
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

    // 電車を出発させる(進行に合わせて画面もスクロール)
    trainAnchor.style.transform = `translateX(${toX - fromX}px)`;
    window.setTimeout(() => scrollToStation(scrollContainer, nextIndex, 'smooth'), TRAIN_TRAVEL_MS * 0.25);

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
      } else if (index <= currentStation) {
        audioManager.play('sfx-tap');
        setReplayMode(true);
        showScreen(STATIONS[index].type as ScreenName);
      }
    });
  });
}
