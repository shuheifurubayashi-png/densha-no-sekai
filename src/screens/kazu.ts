import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { playConfetti } from '../lib/celebrate';
import { loadProgress, saveProgress } from '../lib/storage';
import { getKazuRangeForLoop, STATIONS } from '../data/content';

const QUESTIONS_PER_STATION = 3;
const STYLE_ID = 'kazu-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-kazu {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .kazu-progress {
      font-size: 20px;
      color: #2b4a63;
    }

    .kazu-repeat-button {
      position: absolute;
      top: 16px;
      right: 16px;
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 40px;
    }

    .kazu-repeat-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .kazu-train-track {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      min-height: 90px;
      overflow-x: auto;
      max-width: 100%;
      padding: 8px;
    }

    .kazu-locomotive {
      font-size: 56px;
      flex-shrink: 0;
    }

    .kazu-wagon {
      font-size: 48px;
      flex-shrink: 0;
      animation: kazu-pop 0.35s ease;
    }

    @keyframes kazu-pop {
      0% { transform: scale(0); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .kazu-target {
      font-size: 22px;
      color: #2b4a63;
    }

    .kazu-container-button {
      min-width: 140px;
      min-height: 140px;
      border-radius: 32px;
      background-color: #ffffff;
      box-shadow: 0 8px 0 #cbd8e0;
      font-size: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kazu-container-button:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .kazu-container-button.is-disabled {
      pointer-events: none;
      opacity: 0.6;
    }
  `;
  document.head.appendChild(style);
}

export function renderKazuScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();
  const range = getKazuRangeForLoop(progress.loop);

  let questionIndex = 0;
  let targetCount = 0;
  let loadedCount = 0;
  let inputLocked = false;

  root.innerHTML = `
    <div class="screen screen-kazu">
      <h1 class="screen-title">📦 かず</h1>
      <p class="kazu-progress" data-progress></p>
      <p class="kazu-target" data-target></p>
      <div class="kazu-train-track" data-track>
        <span class="kazu-locomotive">🚂</span>
      </div>
      <button class="kazu-container-button" data-container aria-label="コンテナをのせる">📦</button>
      <button class="kazu-repeat-button" data-repeat aria-label="もういちど きく">🔊</button>
      <button class="back-button" data-back>⬅️ もどる</button>
    </div>
  `;

  const progressEl = root.querySelector<HTMLParagraphElement>('[data-progress]');
  const targetEl = root.querySelector<HTMLParagraphElement>('[data-target]');
  const trackEl = root.querySelector<HTMLDivElement>('[data-track]');
  const containerButton = root.querySelector<HTMLButtonElement>('[data-container]');

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    showScreen('map');
  });

  root.querySelector('[data-repeat]')?.addEventListener('click', () => {
    if (!targetCount) return;
    void audioManager.playVoice(`q-kazu-${targetCount}`);
  });

  function updateProgress(): void {
    if (progressEl) {
      progressEl.textContent = `${questionIndex + 1} / ${QUESTIONS_PER_STATION} もんめ`;
    }
    if (targetEl) {
      targetEl.textContent = `コンテナを ${targetCount}こ のせてね`;
    }
  }

  function resetTrack(): void {
    loadedCount = 0;
    if (trackEl) {
      trackEl.innerHTML = '<span class="kazu-locomotive">🚂</span>';
    }
  }

  function nextQuestion(): void {
    if (questionIndex >= QUESTIONS_PER_STATION) {
      void handleStationClear();
      return;
    }

    targetCount = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    resetTrack();
    updateProgress();
    inputLocked = false;
    containerButton?.classList.remove('is-disabled');

    void audioManager.playVoice(`q-kazu-${targetCount}`);
  }

  async function handleContainerTap(): Promise<void> {
    if (inputLocked) return;

    loadedCount += 1;

    const wagon = document.createElement('span');
    wagon.className = 'kazu-wagon';
    wagon.textContent = '📦';
    trackEl?.appendChild(wagon);

    await audioManager.playVoice(`num-${loadedCount}`);

    if (loadedCount >= targetCount) {
      inputLocked = true;
      containerButton?.classList.add('is-disabled');
      await handleCorrect();
    }
  }

  async function handleCorrect(): Promise<void> {
    audioManager.play('sfx-correct');
    const variant = 1 + Math.floor(Math.random() * 3);
    await audioManager.playVoice(`correct-${variant}`);
    playConfetti();

    questionIndex += 1;
    window.setTimeout(() => nextQuestion(), 900);
  }

  async function handleStationClear(): Promise<void> {
    const latest = loadProgress();
    const clearedIndex = latest.currentStation;
    const clearedStation = STATIONS[clearedIndex];

    await audioManager.playVoice('stamp');
    latest.stamps.push(clearedStation.id);
    saveProgress(latest);

    playConfetti(90, 2400);
    window.setTimeout(() => showScreen('map'), 1600);
  }

  containerButton?.addEventListener('click', () => {
    void handleContainerTap();
  });

  nextQuestion();
}
