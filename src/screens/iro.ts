import { loadProgress } from '../lib/storage';
import { runQuiz } from '../lib/quiz';
import type { QuizQuestion } from '../lib/quiz';
import { IRO_ITEMS, getQuestionCountForLoop, CHOICE_COUNT } from '../data/content';
import type { IroItem } from '../data/content';
import { trainArtStandaloneSvg } from '../ui/trainArt';

const STYLE_ID = 'iro-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-iro {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .iro-card {
      min-width: 180px;
      min-height: 150px;
      width: 200px;
      height: 170px;
      border-radius: 28px;
      background-color: #ffffff;
      box-shadow: 0 8px 0 #cbd8e0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
    }

    .iro-card:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .iro-card.is-disabled {
      pointer-events: none;
    }

    .iro-card.iro-card-shiro {
      background-color: #eef2f5;
    }

    .iro-card-art {
      width: 100%;
    }
  `;
  document.head.appendChild(style);
}

function pickDummies(pool: IroItem[], answer: IroItem, count: number): IroItem[] {
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
  const answer = IRO_ITEMS[Math.floor(Math.random() * IRO_ITEMS.length)];
  const dummies = pickDummies(IRO_ITEMS, answer, CHOICE_COUNT - 1);
  const choices = shuffle([answer, ...dummies]);

  const cardsHtml = choices
    .map((item) => {
      const shiroClass = item.id === 'shiro' ? ' iro-card-shiro' : '';
      return `
        <button class="iro-card${shiroClass}" data-choice="${item.id}">
          <div class="iro-card-art">${trainArtStandaloneSvg('akai-densha', { bodyColor: item.color })}</div>
        </button>
      `;
    })
    .join('');

  return {
    answerId: answer.id,
    cardsHtml,
    promptVoice: [`q-iro-${answer.id}`],
    feedbackVoice: (id) => [`iro-${id}`],
  };
}

export function renderIroScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();

  runQuiz(root, {
    screenClass: 'screen-iro',
    title: '🎨 いろ',
    questionCount: getQuestionCountForLoop(progress.loop),
    buildQuestion,
  });
}
