import { loadProgress } from '../lib/storage';
import { runQuiz } from '../lib/quiz';
import type { QuizQuestion } from '../lib/quiz';
import { KATACHI_ITEMS, getQuestionCountForLoop } from '../data/content';
import type { KatachiItem } from '../data/content';
import { starPath } from '../ui/art';

const STYLE_ID = 'katachi-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-katachi {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .screen-katachi .quiz-cards {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .katachi-board {
      width: 180px;
    }

    .katachi-board-svg {
      width: 100%;
      display: block;
    }

    .katachi-choices {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: center;
    }

    .katachi-choice-button {
      min-width: 90px;
      min-height: 90px;
      width: 100px;
      height: 100px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 8px 0 #cbd8e0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }

    .katachi-choice-button svg {
      width: 100%;
      height: 100%;
    }

    .katachi-choice-button:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .katachi-choice-button.is-disabled {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

/** 形ごとの固定カラー(まる=赤/さんかく=緑/しかく=青/ほし=黄/はーと=ピンク/だいや=水色) */
const SHAPE_COLORS: Record<string, { fill: string; stroke: string }> = {
  maru: { fill: '#e24b4a', stroke: '#b83a3a' },
  sankaku: { fill: '#59b25c', stroke: '#3e7d41' },
  shikaku: { fill: '#4a90d9', stroke: '#2f6cb0' },
  hoshi: { fill: '#f5c542', stroke: '#c79a1a' },
  haato: { fill: '#e97fb2', stroke: '#c14f8a' },
  daiya: { fill: '#5ec8d8', stroke: '#3a9aab' },
};

/** 形ID→SVG図形断片(中心0,0基準)。fill/strokeは呼び出し側で色分けする */
function shapeSvg(id: string, fill: string, stroke: string): string {
  const sw = 5;
  switch (id) {
    case 'maru':
      return `<circle cx="0" cy="0" r="32" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    case 'sankaku':
      return `<polygon points="0,-34 30,24 -30,24" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />`;
    case 'shikaku':
      return `<rect x="-28" y="-28" width="56" height="56" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    case 'hoshi':
      return `<path d="${starPath(34)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />`;
    case 'haato':
      return `<path d="M 0,26 C -34,0 -34,-30 -12,-30 C -2,-30 0,-20 0,-16 C 0,-20 2,-30 12,-30 C 34,-30 34,0 0,26 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />`;
    case 'daiya':
      return `<polygon points="0,-34 26,0 0,34 -26,0" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" />`;
    default:
      return `<circle cx="0" cy="0" r="32" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
  }
}

/** 「はめる穴」= 木の板に答えの形がシルエットでくり抜かれて見えるSVG */
function boardSvg(answerId: string): string {
  return `
    <svg viewBox="-60 -60 120 120" class="katachi-board-svg" aria-hidden="true">
      <rect x="-58" y="-58" width="116" height="116" rx="20" fill="#c8925a" stroke="#a5753f" stroke-width="6" />
      ${shapeSvg(answerId, '#6b6b6b', '#4a4a4a')}
    </svg>
  `;
}

function choiceButtonHtml(item: KatachiItem): string {
  const colors = SHAPE_COLORS[item.id] ?? { fill: '#999999', stroke: '#666666' };
  return `
    <button class="katachi-choice-button" data-choice="${item.id}" aria-label="${item.label}">
      <svg viewBox="-40 -40 80 80" aria-hidden="true">${shapeSvg(item.id, colors.fill, colors.stroke)}</svg>
    </button>
  `;
}

function pickDummies(pool: KatachiItem[], answer: KatachiItem, count: number): KatachiItem[] {
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

/** loopが0(初回)は選択肢3枚、それ以降は4枚 */
function createBuildQuestion(loop: number): (previousAnswerId: string | null) => QuizQuestion {
  const choiceCount = loop === 0 ? 3 : 4;

  return (previousAnswerId) => {
    const pool = KATACHI_ITEMS.filter((item) => item.id !== previousAnswerId);
    const answer = pool[Math.floor(Math.random() * pool.length)];
    const dummies = pickDummies(KATACHI_ITEMS, answer, choiceCount - 1);
    const choices = shuffle([answer, ...dummies]);

    const cardsHtml = `
      <div class="katachi-board">${boardSvg(answer.id)}</div>
      <div class="katachi-choices">
        ${choices.map((item) => choiceButtonHtml(item)).join('')}
      </div>
    `;

    return {
      answerId: answer.id,
      cardsHtml,
      promptVoice: ['q-katachi'],
      feedbackVoice: (choiceId) => [`katachi-${choiceId}`],
    };
  };
}

export function renderKatachiScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();

  runQuiz(root, {
    screenClass: 'screen-katachi',
    title: '🔷 かたち',
    questionCount: getQuestionCountForLoop(progress.loop),
    buildQuestion: createBuildQuestion(progress.loop),
  });
}
