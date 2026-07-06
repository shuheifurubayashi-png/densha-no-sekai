import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { playConfetti } from '../lib/celebrate';
import { loadProgress, saveProgress } from '../lib/storage';
import { getKanaSetForLoop, KANA_ROMAJI, STATIONS, QUESTIONS_PER_STATION, CHOICE_COUNT } from '../data/content';

const STYLE_ID = 'hiragana-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-hiragana {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .hiragana-progress {
      font-size: 20px;
      color: #2b4a63;
    }

    .hiragana-repeat-button {
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 40px;
    }

    .hiragana-repeat-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .hiragana-cards {
      display: grid;
      grid-template-columns: repeat(2, auto);
      gap: 24px;
      justify-content: center;
    }

    .hiragana-card {
      min-width: 120px;
      min-height: 120px;
      width: 140px;
      height: 140px;
      border-radius: 28px;
      background-color: #ffffff;
      box-shadow: 0 8px 0 #cbd8e0;
      font-size: 72px;
      color: #2b4a63;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hiragana-card:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .hiragana-card.is-disabled {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

function pickDummies(pool: readonly string[], answer: string, count: number): string[] {
  const candidates = pool.filter((kana) => kana !== answer);
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function renderHiraganaScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();
  const kanaSet = getKanaSetForLoop(progress.loop);

  let questionIndex = 0;
  let inputLocked = false;
  let currentAnswer = '';

  root.innerHTML = `
    <div class="screen screen-hiragana">
      <h1 class="screen-title">🚉 もじ</h1>
      <p class="hiragana-progress" data-progress></p>
      <div class="hiragana-cards" data-cards></div>
      <button class="hiragana-repeat-button" data-repeat aria-label="もういちど きく">🔊</button>
      <button class="back-button" data-back>⬅️ もどる</button>
    </div>
  `;

  const progressEl = root.querySelector<HTMLParagraphElement>('[data-progress]');
  const cardsEl = root.querySelector<HTMLDivElement>('[data-cards]');

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    showScreen('map');
  });

  root.querySelector('[data-repeat]')?.addEventListener('click', () => {
    if (!currentAnswer) return;
    void audioManager.playVoice(`q-kana-${KANA_ROMAJI[currentAnswer]}`);
  });

  function updateProgress(): void {
    if (progressEl) {
      progressEl.textContent = `${questionIndex + 1} / ${QUESTIONS_PER_STATION} もんめ`;
    }
  }

  function nextQuestion(): void {
    if (questionIndex >= QUESTIONS_PER_STATION) {
      void handleStationClear();
      return;
    }

    updateProgress();
    inputLocked = false;

    const answer = kanaSet[Math.floor(Math.random() * kanaSet.length)];
    currentAnswer = answer;
    const dummies = pickDummies(kanaSet, answer, CHOICE_COUNT - 1);
    const choices = shuffle([answer, ...dummies]);

    if (cardsEl) {
      cardsEl.innerHTML = choices
        .map((kana) => `<button class="hiragana-card" data-kana="${kana}">${kana}</button>`)
        .join('');

      cardsEl.querySelectorAll<HTMLButtonElement>('[data-kana]').forEach((card) => {
        card.addEventListener('click', () => handleCardTap(card.dataset.kana ?? ''));
      });
    }

    void audioManager.playVoice(`q-kana-${KANA_ROMAJI[answer]}`);
  }

  function setCardsEnabled(enabled: boolean): void {
    cardsEl?.querySelectorAll('[data-kana]').forEach((card) => {
      card.classList.toggle('is-disabled', !enabled);
    });
  }

  async function handleCardTap(kana: string): Promise<void> {
    if (inputLocked || !kana) return;
    inputLocked = true;
    setCardsEnabled(false);

    await audioManager.playVoice(`kana-${KANA_ROMAJI[kana]}`);

    if (kana === currentAnswer) {
      await handleCorrect();
    } else {
      await handleIncorrect();
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

  async function handleIncorrect(): Promise<void> {
    await audioManager.playVoice('retry');
    inputLocked = false;
    setCardsEnabled(true);
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

  nextQuestion();
}
