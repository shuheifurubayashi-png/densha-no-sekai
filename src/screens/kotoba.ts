import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { playConfetti, playFireworks } from '../lib/celebrate';
import { loadProgress, saveProgress } from '../lib/storage';
import { STATIONS, WORDS, QUESTIONS_PER_STATION, CHOICE_COUNT } from '../data/content';
import type { Word } from '../data/content';

const GOAL_STATION_INDEX = 5;
const STYLE_ID = 'kotoba-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-kotoba {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .kotoba-progress {
      font-size: 20px;
      color: #2b4a63;
    }

    .kotoba-repeat-button {
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 40px;
    }

    .kotoba-repeat-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .kotoba-cards {
      display: grid;
      grid-template-columns: repeat(2, auto);
      gap: 24px;
      justify-content: center;
    }

    .kotoba-card {
      min-width: 130px;
      min-height: 150px;
      width: 150px;
      height: 170px;
      border-radius: 28px;
      background-color: #ffffff;
      box-shadow: 0 8px 0 #cbd8e0;
      color: #2b4a63;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .kotoba-card:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .kotoba-card.is-disabled {
      pointer-events: none;
    }

    .kotoba-card-emoji {
      font-size: 56px;
    }

    .kotoba-card-label {
      font-size: 22px;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

function pickDummies(pool: Word[], answer: Word, count: number): Word[] {
  const candidates = pool.filter((word) => word.id !== answer.id);
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

export function renderKotobaScreen(root: HTMLElement): void {
  ensureStyle();

  let questionIndex = 0;
  let inputLocked = false;
  let currentAnswer: Word | null = null;

  root.innerHTML = `
    <div class="screen screen-kotoba">
      <h1 class="screen-title">🗣️ ことば</h1>
      <p class="kotoba-progress" data-progress></p>
      <div class="kotoba-cards" data-cards></div>
      <button class="kotoba-repeat-button" data-repeat aria-label="もういちど きく">🔊</button>
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
    void audioManager.playVoice(`q-word-${currentAnswer.id}`);
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

    const answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    currentAnswer = answer;
    const dummies = pickDummies(WORDS, answer, CHOICE_COUNT - 1);
    const choices = shuffle([answer, ...dummies]);

    if (cardsEl) {
      cardsEl.innerHTML = choices
        .map(
          (word) => `
            <button class="kotoba-card" data-word="${word.id}">
              <span class="kotoba-card-emoji">${word.emoji}</span>
              <span class="kotoba-card-label">${word.label}</span>
            </button>
          `,
        )
        .join('');

      cardsEl.querySelectorAll<HTMLButtonElement>('[data-word]').forEach((card) => {
        card.addEventListener('click', () => handleCardTap(card.dataset.word ?? ''));
      });
    }

    void audioManager.playVoice(`q-word-${answer.id}`);
  }

  function setCardsEnabled(enabled: boolean): void {
    cardsEl?.querySelectorAll('[data-word]').forEach((card) => {
      card.classList.toggle('is-disabled', !enabled);
    });
  }

  async function handleCardTap(wordId: string): Promise<void> {
    if (inputLocked || !wordId) return;
    inputLocked = true;
    setCardsEnabled(false);

    await audioManager.playVoice(`word-${wordId}`);

    if (currentAnswer && wordId === currentAnswer.id) {
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
    const isGoal = clearedIndex === GOAL_STATION_INDEX;

    await audioManager.playVoice('stamp');
    latest.stamps.push(clearedStation.id);

    if (isGoal) {
      saveProgress(latest);
      audioManager.play('sfx-fanfare');
      await audioManager.playVoice('goal');
      playFireworks();

      window.setTimeout(() => {
        const finished = loadProgress();
        const advanced = {
          currentStation: 0,
          loop: finished.loop + 1,
          stamps: finished.stamps,
        };
        saveProgress(advanced);
        showScreen('map');
      }, 3200);
      return;
    }

    saveProgress(latest);
    playConfetti(90, 2400);
    window.setTimeout(() => showScreen('map'), 1600);
  }

  nextQuestion();
}
