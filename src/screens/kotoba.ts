import { runQuiz } from '../lib/quiz';
import type { QuizQuestion } from '../lib/quiz';
import { loadProgress } from '../lib/storage';
import { WORDS, getQuestionCountForLoop, CHOICE_COUNT } from '../data/content';
import type { Word } from '../data/content';

const STYLE_ID = 'kotoba-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-kotoba {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
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

function buildQuestion(): QuizQuestion {
  const answer = WORDS[Math.floor(Math.random() * WORDS.length)];
  const dummies = pickDummies(WORDS, answer, CHOICE_COUNT - 1);
  const choices = shuffle([answer, ...dummies]);

  const cardsHtml = choices
    .map(
      (word) => `
        <button class="kotoba-card" data-choice="${word.id}">
          <span class="kotoba-card-emoji">${word.emoji}</span>
          <span class="kotoba-card-label">${word.label}</span>
        </button>
      `,
    )
    .join('');

  return {
    answerId: answer.id,
    cardsHtml,
    promptVoice: [`q-word-${answer.id}`],
    feedbackVoice: (id) => [`word-${id}`],
  };
}

export function renderKotobaScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();

  runQuiz(root, {
    screenClass: 'screen-kotoba',
    title: '🗣️ ことば',
    questionCount: getQuestionCountForLoop(progress.loop),
    buildQuestion,
  });
}
