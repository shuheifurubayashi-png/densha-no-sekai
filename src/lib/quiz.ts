import { showScreen } from '../app';
import { audioManager } from './audio';
import { playConfetti, playFireworks } from './celebrate';
import { loadProgress, saveProgress } from './storage';
import { STATIONS } from '../data/content';
import { TRAINS, computeUnlockedTrains } from '../data/trains';
import { trainArtStandaloneSvg } from '../ui/trainArt';

const STYLE_ID = 'quiz-screen-style';

export interface QuizQuestion {
  answerId: string;
  cardsHtml: string; // 選択肢ボタン群。各ボタンは data-choice="<id>" を持つこと
  promptVoice: string[]; // 出題時・🔊リピート時に順に再生
  feedbackVoice: (choiceId: string) => string[]; // タップ直後に順に再生
}

export interface QuizConfig {
  screenClass: string; // 例 'screen-hiragana'
  title: string; // 例 '🚉 もじ'
  questionCount: number;
  buildQuestion: (previousAnswerId: string | null) => QuizQuestion;
}

let replayMode = false;
/** クリア済み駅の再プレイ中はスタンプ・進行状況を変更しない */
export function setReplayMode(value: boolean): void {
  replayMode = value;
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .quiz-progress {
      font-size: 20px;
      color: #2b4a63;
    }

    .quiz-repeat-button {
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 40px;
    }

    .quiz-repeat-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .quiz-cards {
      display: grid;
      grid-template-columns: repeat(2, auto);
      gap: 24px;
      justify-content: center;
    }
  `;
  document.head.appendChild(style);
}

export function runQuiz(root: HTMLElement, config: QuizConfig): void {
  ensureStyle();

  let questionIndex = 0;
  let inputLocked = false;
  let currentQuestion: QuizQuestion | null = null;

  root.innerHTML = `
    <div class="screen ${config.screenClass}">
      <h1 class="screen-title">${config.title}</h1>
      <p class="quiz-progress" data-progress></p>
      <div class="quiz-cards" data-cards></div>
      <button class="quiz-repeat-button" data-repeat aria-label="もういちど きく">🔊</button>
      <button class="back-button" data-back>⬅️ もどる</button>
    </div>
  `;

  const progressEl = root.querySelector<HTMLParagraphElement>('[data-progress]');
  const cardsEl = root.querySelector<HTMLDivElement>('[data-cards]');

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    showScreen('map');
  });

  root.querySelector('[data-repeat]')?.addEventListener('click', () => {
    if (!currentQuestion) return;
    void audioManager.playVoiceSeq(currentQuestion.promptVoice);
  });

  function updateProgress(): void {
    if (progressEl) {
      progressEl.textContent = `${questionIndex + 1} / ${config.questionCount} もんめ`;
    }
  }

  function nextQuestion(): void {
    if (!cardsEl?.isConnected) return;

    if (questionIndex >= config.questionCount) {
      void completeStation();
      return;
    }

    updateProgress();
    inputLocked = false;

    const question = config.buildQuestion(currentQuestion?.answerId ?? null);
    currentQuestion = question;

    if (cardsEl) {
      cardsEl.innerHTML = question.cardsHtml;

      cardsEl.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((card) => {
        card.addEventListener('click', () => handleCardTap(card.dataset.choice ?? ''));
      });
    }

    void audioManager.playVoiceSeq(question.promptVoice);
  }

  function setCardsEnabled(enabled: boolean): void {
    cardsEl?.querySelectorAll('[data-choice]').forEach((card) => {
      card.classList.toggle('is-disabled', !enabled);
    });
  }

  async function handleCardTap(choiceId: string): Promise<void> {
    if (inputLocked || !choiceId || !currentQuestion) return;
    inputLocked = true;
    setCardsEnabled(false);

    await audioManager.playVoiceSeq(currentQuestion.feedbackVoice(choiceId));

    if (choiceId === currentQuestion.answerId) {
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

  nextQuestion();
}

const TRAIN_UNLOCK_OVERLAY_ID = 'train-unlock-overlay';
const TRAIN_UNLOCK_STYLE_ID = 'train-unlock-overlay-style';

function ensureTrainUnlockStyle(): void {
  if (document.getElementById(TRAIN_UNLOCK_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = TRAIN_UNLOCK_STYLE_ID;
  style.textContent = `
    .train-unlock-overlay {
      position: fixed;
      inset: 0;
      z-index: 1100;
      background-color: rgba(255, 255, 255, 0.92);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }

    .train-unlock-message {
      font-size: 32px;
      font-weight: bold;
      color: #2b4a63;
      margin: 0;
    }

    .train-unlock-art {
      width: 420px;
    }

    .train-unlock-name {
      font-size: 40px;
      font-weight: bold;
      color: #d85a30;
      margin: 0;
    }
  `;
  document.head.appendChild(style);
}

/** 新車両アンロック演出を表示し、完了後にmapへ戻る */
function showTrainUnlockCeremony(trainId: string): void {
  ensureTrainUnlockStyle();

  const train = TRAINS.find((item) => item.id === trainId);
  if (!train) {
    showScreen('map');
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = TRAIN_UNLOCK_OVERLAY_ID;
  overlay.className = 'train-unlock-overlay';
  overlay.innerHTML = `
    <p class="train-unlock-message">あたらしい でんしゃを げっと！</p>
    <div class="train-unlock-art">${trainArtStandaloneSvg(train.id)}</div>
    <p class="train-unlock-name">${train.name}</p>
  `;
  document.body.appendChild(overlay);

  let dismissed = false;
  function dismiss(): void {
    if (dismissed) return;
    dismissed = true;
    overlay.remove();
    showScreen('map');
  }

  overlay.addEventListener('click', dismiss);

  void audioManager.playFirstAvailable(['get-train']).then(() => {
    void audioManager.playFirstAvailable([train.voice]);
  });
  playFireworks();

  window.setTimeout(dismiss, 4200);
}

export async function completeStation(): Promise<void> {
  if (replayMode) {
    setReplayMode(false);
    audioManager.play('sfx-fanfare');
    playConfetti(90, 2400);
    window.setTimeout(() => showScreen('map'), 1600);
    return;
  }

  const latest = loadProgress();
  const clearedIndex = latest.currentStation;
  const clearedStation = STATIONS[clearedIndex];
  const isGoal = clearedIndex === STATIONS.length - 1;

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
        ...finished,
        currentStation: 0,
        loop: finished.loop + 1,
      };
      const unlockedNow = computeUnlockedTrains(advanced.loop, advanced.stamps.length).filter(
        (id) => !finished.unlockedTrains.includes(id),
      );
      advanced.unlockedTrains = [...finished.unlockedTrains, ...unlockedNow];
      saveProgress(advanced);

      if (unlockedNow.length === 0) {
        showScreen('map');
        return;
      }

      showTrainUnlockCeremony(unlockedNow[0]);
    }, 3200);
    return;
  }

  saveProgress(latest);
  playConfetti(90, 2400);
  window.setTimeout(() => showScreen('map'), 1600);
}
