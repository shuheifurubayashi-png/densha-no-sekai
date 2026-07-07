import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { playConfetti } from '../lib/celebrate';
import { loadProgress } from '../lib/storage';
import { completeStation } from '../lib/quiz';
import { getKazuRangeForLoop, getQuestionCountForLoop } from '../data/content';

const MAX_CONTAINERS = 10;
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

    .kazu-done-button {
      min-width: 200px;
      min-height: 120px;
      border-radius: 32px;
      background-color: #ffd166;
      box-shadow: 0 8px 0 #d9a441;
      font-size: 32px;
      font-weight: bold;
      color: #2b4a63;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .kazu-done-button:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #d9a441;
    }

    .kazu-done-button.is-disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    .kazu-check-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: center;
    }

    .kazu-check-card {
      min-width: 120px;
      min-height: 120px;
      width: 140px;
      height: 140px;
      border-radius: 28px;
      background-color: #ffffff;
      box-shadow: 0 8px 0 #cbd8e0;
      color: #2b4a63;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .kazu-check-card:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .kazu-check-card.is-disabled {
      pointer-events: none;
    }

    .kazu-check-number {
      font-size: 56px;
      font-weight: bold;
    }

    .kazu-check-dots {
      font-size: 16px;
      max-width: 100px;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickCheckDummies(answer: number, count: number): number[] {
  const candidates: number[] = [];
  for (let delta = 1; candidates.length < count && delta <= MAX_CONTAINERS; delta += 1) {
    if (answer - delta >= 1) candidates.push(answer - delta);
    if (candidates.length >= count) break;
    if (answer + delta <= MAX_CONTAINERS) candidates.push(answer + delta);
  }
  return candidates.slice(0, count);
}

export function renderKazuScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();
  const range = getKazuRangeForLoop(progress.loop);
  const questionCount = getQuestionCountForLoop(progress.loop);

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
      <button class="kazu-done-button" data-done aria-label="できた">🔔 できた</button>
      <div class="kazu-check-cards" data-check-cards></div>
      <button class="kazu-repeat-button" data-repeat aria-label="もういちど きく">🔊</button>
      <button class="back-button" data-back>⬅️ もどる</button>
    </div>
  `;

  const progressEl = root.querySelector<HTMLParagraphElement>('[data-progress]');
  const targetEl = root.querySelector<HTMLParagraphElement>('[data-target]');
  const trackEl = root.querySelector<HTMLDivElement>('[data-track]');
  const containerButton = root.querySelector<HTMLButtonElement>('[data-container]');
  const doneButton = root.querySelector<HTMLButtonElement>('[data-done]');
  const checkCardsEl = root.querySelector<HTMLDivElement>('[data-check-cards]');

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    showScreen('map');
  });

  root.querySelector('[data-repeat]')?.addEventListener('click', () => {
    if (!targetCount) return;
    void audioManager.playVoice(`q-kazu-${targetCount}`);
  });

  function updateProgress(): void {
    if (progressEl) {
      progressEl.textContent = `${questionIndex + 1} / ${questionCount} もんめ`;
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

  function showLoadPhase(): void {
    containerButton?.classList.remove('is-disabled');
    if (containerButton) containerButton.style.display = '';
    if (doneButton) doneButton.style.display = '';
    doneButton?.classList.remove('is-disabled');
    if (checkCardsEl) {
      checkCardsEl.style.display = 'none';
      checkCardsEl.innerHTML = '';
    }
    if (targetEl) targetEl.style.display = '';
  }

  function showCheckPhase(): void {
    if (containerButton) containerButton.style.display = 'none';
    if (doneButton) doneButton.style.display = 'none';
    if (checkCardsEl) checkCardsEl.style.display = '';
  }

  function nextQuestion(): void {
    if (questionIndex >= questionCount) {
      void completeStation();
      return;
    }

    targetCount = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    resetTrack();
    updateProgress();
    inputLocked = false;
    showLoadPhase();

    void audioManager.playVoice(`q-kazu-${targetCount}`);
  }

  async function handleContainerTap(): Promise<void> {
    if (inputLocked) return;
    if (loadedCount >= MAX_CONTAINERS) return;

    loadedCount += 1;

    const wagon = document.createElement('span');
    wagon.className = 'kazu-wagon';
    wagon.textContent = '📦';
    trackEl?.appendChild(wagon);

    await audioManager.playVoice(`num-${loadedCount}`);
  }

  async function handleDoneTap(): Promise<void> {
    if (inputLocked) return;
    inputLocked = true;
    containerButton?.classList.add('is-disabled');
    doneButton?.classList.add('is-disabled');

    if (loadedCount === targetCount) {
      await handleLoadCorrect();
    } else {
      await audioManager.playVoice('retry');
      resetTrack();
      inputLocked = false;
      containerButton?.classList.remove('is-disabled');
      doneButton?.classList.remove('is-disabled');
    }
  }

  async function handleLoadCorrect(): Promise<void> {
    audioManager.play('sfx-correct');
    const variant = 1 + Math.floor(Math.random() * 3);
    await audioManager.playVoice(`correct-${variant}`);
    playConfetti();

    window.setTimeout(() => startCheckPhase(), 900);
  }

  function startCheckPhase(): void {
    showCheckPhase();
    inputLocked = false;

    const dummies = pickCheckDummies(targetCount, 2);
    const choices = shuffle([targetCount, ...dummies]);

    if (checkCardsEl) {
      checkCardsEl.innerHTML = choices
        .map(
          (num) => `
            <button class="kazu-check-card" data-num="${num}">
              <span class="kazu-check-number">${num}</span>
              <span class="kazu-check-dots">${'●'.repeat(num)}</span>
            </button>
          `,
        )
        .join('');

      checkCardsEl.querySelectorAll<HTMLButtonElement>('[data-num]').forEach((card) => {
        card.addEventListener('click', () => handleCheckTap(Number(card.dataset.num)));
      });
    }

    void audioManager.playVoice('q-kazu-check');
  }

  function setCheckCardsEnabled(enabled: boolean): void {
    checkCardsEl?.querySelectorAll('[data-num]').forEach((card) => {
      card.classList.toggle('is-disabled', !enabled);
    });
  }

  async function handleCheckTap(num: number): Promise<void> {
    if (inputLocked) return;
    inputLocked = true;
    setCheckCardsEnabled(false);

    if (num === targetCount) {
      await handleCheckCorrect();
    } else {
      await audioManager.playVoice('retry');
      inputLocked = false;
      setCheckCardsEnabled(true);
    }
  }

  async function handleCheckCorrect(): Promise<void> {
    audioManager.play('sfx-correct');
    const variant = 1 + Math.floor(Math.random() * 3);
    await audioManager.playVoice(`correct-${variant}`);
    playConfetti();

    questionIndex += 1;
    window.setTimeout(() => nextQuestion(), 900);
  }

  containerButton?.addEventListener('click', () => {
    void handleContainerTap();
  });

  doneButton?.addEventListener('click', () => {
    void handleDoneTap();
  });

  nextQuestion();
}
