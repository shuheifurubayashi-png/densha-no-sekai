import { loadProgress } from '../lib/storage';
import { runQuiz } from '../lib/quiz';
import type { QuizQuestion } from '../lib/quiz';
import { getKanaSetForLoop, getQuestionCountForLoop, KANA_ROMAJI, CHOICE_COUNT } from '../data/content';

const STYLE_ID = 'hiragana-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-hiragana {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
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

  function buildQuestion(previousAnswerId: string | null): QuizQuestion {
    const pool = kanaSet.filter((kana) => kana !== previousAnswerId);
    const answer = pool[Math.floor(Math.random() * pool.length)];
    const dummies = pickDummies(kanaSet, answer, CHOICE_COUNT - 1);
    const choices = shuffle([answer, ...dummies]);

    const cardsHtml = choices
      .map((kana) => `<button class="hiragana-card" data-choice="${kana}">${kana}</button>`)
      .join('');

    return {
      answerId: answer,
      cardsHtml,
      promptVoice: [`q-kana-${KANA_ROMAJI[answer]}`],
      feedbackVoice: (id) => [`kana-${KANA_ROMAJI[id]}`],
    };
  }

  runQuiz(root, {
    screenClass: 'screen-hiragana',
    title: '🚉 もじ',
    questionCount: getQuestionCountForLoop(progress.loop),
    buildQuestion,
  });
}
