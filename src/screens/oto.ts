import { loadProgress } from '../lib/storage';
import { runQuiz } from '../lib/quiz';
import type { QuizQuestion } from '../lib/quiz';
import { OTO_ITEMS, getQuestionCountForLoop, CHOICE_COUNT } from '../data/content';
import type { OtoItem } from '../data/content';

const STYLE_ID = 'oto-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-oto {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .oto-card {
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

    .oto-card:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .oto-card.is-disabled {
      pointer-events: none;
    }

    .oto-card-emoji {
      font-size: 56px;
    }

    .oto-card-label {
      font-size: 22px;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

function pickDummies(pool: OtoItem[], answer: OtoItem, count: number): OtoItem[] {
  const candidates = pool.filter((item) => item.id !== answer.id);
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

function buildQuestion(): QuizQuestion {
  const answer = OTO_ITEMS[Math.floor(Math.random() * OTO_ITEMS.length)];
  const dummies = pickDummies(OTO_ITEMS, answer, CHOICE_COUNT - 1);
  const choices = shuffle([answer, ...dummies]);

  const cardsHtml = choices
    .map(
      (item) => `
        <button class="oto-card" data-choice="${item.id}">
          <span class="oto-card-emoji">${item.emoji}</span>
          <span class="oto-card-label">${item.label}</span>
        </button>
      `,
    )
    .join('');

  return {
    answerId: answer.id,
    cardsHtml,
    promptVoice: ['q-oto', answer.sfx],
    feedbackVoice: (id) => [OTO_ITEMS.find((item) => item.id === id)?.wordVoice ?? ''],
  };
}

export function renderOtoScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();

  runQuiz(root, {
    screenClass: 'screen-oto',
    title: '🔔 おと',
    questionCount: getQuestionCountForLoop(progress.loop),
    buildQuestion,
  });
}
