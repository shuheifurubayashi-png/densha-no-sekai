import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { playConfetti } from '../lib/celebrate';
import { loadProgress } from '../lib/storage';
import { completeStation } from '../lib/quiz';
import { KISEKAE_ITEMS, getQuestionCountForLoop } from '../data/content';
import type { KisekaeItem } from '../data/content';
import { trainArtSvg } from '../ui/trainArt';
import { starPath } from '../ui/art';

const STYLE_ID = 'kisekae-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-kisekae {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
    }

    .kisekae-progress {
      font-size: 20px;
      color: #2b4a63;
    }

    .kisekae-train-wrap {
      width: 320px;
      max-width: 80vw;
    }

    .kisekae-train-svg {
      width: 100%;
      display: block;
    }

    .kisekae-items {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: center;
    }

    .kisekae-item-button {
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

    .kisekae-item-button svg {
      width: 100%;
      height: 100%;
    }

    .kisekae-item-button:active {
      transform: translateY(4px);
      box-shadow: 0 4px 0 #cbd8e0;
    }

    .kisekae-item-button.is-disabled {
      pointer-events: none;
    }

    .kisekae-repeat-button {
      min-width: 80px;
      min-height: 80px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 40px;
    }

    .kisekae-repeat-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
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

/** あかい/あおい ぼうし。あご紐なしのシンプルな山型ぼうし */
function boushiShape(color: string): string {
  return `
    <g>
      <path d="M -22,10 Q -22,-22 0,-30 Q 22,-22 22,10 Z" fill="${color}" stroke="#00000033" stroke-width="2.5" />
      <rect x="-26" y="6" width="52" height="10" rx="5" fill="${color}" stroke="#00000033" stroke-width="2.5" />
      <circle cx="0" cy="-30" r="6" fill="#ffe066" />
    </g>
  `;
}

/** まふらー。帯+垂らした両端 */
function mafuraaShape(): string {
  return `
    <g>
      <rect x="-30" y="-8" width="60" height="16" rx="8" fill="#e24b4a" stroke="#b83a3a" stroke-width="2.5" />
      <rect x="-10" y="6" width="12" height="26" rx="4" fill="#e24b4a" stroke="#b83a3a" stroke-width="2.5" />
      <rect x="4" y="6" width="12" height="30" rx="4" fill="#c8342f" stroke="#b83a3a" stroke-width="2.5" />
    </g>
  `;
}

/** はた。ポール+三角旗 */
function hataShape(): string {
  return `
    <g>
      <line x1="0" y1="10" x2="0" y2="-34" stroke="#8a7a6a" stroke-width="4" stroke-linecap="round" />
      <path d="M 0,-34 L 26,-24 L 0,-14 Z" fill="#f5c542" stroke="#c79a1a" stroke-width="2" stroke-linejoin="round" />
    </g>
  `;
}

/** ほしのかざり。art.tsのstarPathを再利用 */
function hoshiShape(): string {
  return `<path d="${starPath(16)}" fill="#ffd166" stroke="#c79a1a" stroke-width="2.5" stroke-linejoin="round" />`;
}

/** りぼん。蝶結び風 */
function ribonShape(): string {
  return `
    <g>
      <path d="M -18,-10 L -2,0 L -18,10 Z" fill="#e85d9c" stroke="#ba3d78" stroke-width="2" stroke-linejoin="round" />
      <path d="M 18,-10 L 2,0 L 18,10 Z" fill="#e85d9c" stroke="#ba3d78" stroke-width="2" stroke-linejoin="round" />
      <circle cx="0" cy="0" r="5" fill="#ba3d78" />
    </g>
  `;
}

interface KisekaeArt {
  /** ボタン単体表示用(中心0,0基準の図形断片) */
  shape: () => string;
  /** 電車座標系(trainArtSvg基準)へ装着した状態で重ねるtransform */
  overlayTransform: string;
}

const KISEKAE_ART: Record<string, KisekaeArt> = {
  'boushi-aka': { shape: () => boushiShape('#e24b4a'), overlayTransform: 'translate(45,-60)' },
  'boushi-ao': { shape: () => boushiShape('#4a90d9'), overlayTransform: 'translate(45,-60)' },
  mafuraa: { shape: mafuraaShape, overlayTransform: 'translate(45,-26)' },
  hata: { shape: hataShape, overlayTransform: 'translate(-100,-40)' },
  hoshi: { shape: hoshiShape, overlayTransform: 'translate(-20,-30)' },
  ribon: { shape: ribonShape, overlayTransform: 'translate(-70,-28)' },
};

function itemButtonHtml(item: KisekaeItem): string {
  const art = KISEKAE_ART[item.id];
  return `
    <button class="kisekae-item-button" data-choice="${item.id}" aria-label="${item.label}">
      <svg viewBox="-40 -40 80 80" aria-hidden="true">${art ? art.shape() : ''}</svg>
    </button>
  `;
}

/** 選択中の電車を、装着済みアイテムを重ねて描画する */
function trainWithItemsSvg(trainId: string, equippedIds: string[]): string {
  const overlays = equippedIds
    .map((id) => {
      const art = KISEKAE_ART[id];
      if (!art) return '';
      return `<g transform="${art.overlayTransform}">${art.shape()}</g>`;
    })
    .join('');
  return `
    <svg viewBox="-118 -108 236 120" class="kisekae-train-svg" aria-hidden="true">
      ${trainArtSvg(trainId)}
      ${overlays}
    </svg>
  `;
}

/** お題+ダミー3つ(未装着から優先、足りなければ装着済みから補充) */
function pickChoices(remaining: KisekaeItem[], equipped: KisekaeItem[], target: KisekaeItem): KisekaeItem[] {
  const remainingDummies = shuffle(remaining.filter((item) => item.id !== target.id));
  const equippedDummies = shuffle(equipped);
  const dummies = [...remainingDummies, ...equippedDummies].slice(0, 3);
  return shuffle([target, ...dummies]);
}

export function renderKisekaeScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();
  const questionCount = getQuestionCountForLoop(progress.loop);

  let questionIndex = 0;
  let equippedIds: string[] = [];
  let target: KisekaeItem | null = null;
  let inputLocked = false;

  root.innerHTML = `
    <div class="screen screen-kisekae">
      <h1 class="screen-title">🎀 おしゃれ</h1>
      <p class="kisekae-progress" data-progress></p>
      <div class="kisekae-train-wrap" data-train></div>
      <div class="kisekae-items" data-items></div>
      <button class="kisekae-repeat-button" data-repeat aria-label="もういちど きく">🔊</button>
      <button class="back-button" data-back>⬅️ もどる</button>
    </div>
  `;

  const progressEl = root.querySelector<HTMLParagraphElement>('[data-progress]');
  const trainEl = root.querySelector<HTMLDivElement>('[data-train]');
  const itemsEl = root.querySelector<HTMLDivElement>('[data-items]');

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    showScreen('map');
  });

  root.querySelector('[data-repeat]')?.addEventListener('click', () => {
    if (!target) return;
    void audioManager.playVoiceSeq([`q-kisekae-${target.id}`]);
  });

  function updateProgress(): void {
    if (progressEl) {
      progressEl.textContent = `${questionIndex + 1} / ${questionCount} もんめ`;
    }
  }

  function updateTrainDisplay(): void {
    if (trainEl) {
      trainEl.innerHTML = trainWithItemsSvg(progress.selectedTrain, equippedIds);
    }
  }

  function setItemsEnabled(enabled: boolean): void {
    itemsEl?.querySelectorAll('[data-choice]').forEach((button) => {
      button.classList.toggle('is-disabled', !enabled);
    });
  }

  function nextQuestion(): void {
    if (!itemsEl?.isConnected) return;

    const remaining = KISEKAE_ITEMS.filter((item) => !equippedIds.includes(item.id));

    if (questionIndex >= questionCount || remaining.length === 0) {
      void completeStation();
      return;
    }

    target = remaining[Math.floor(Math.random() * remaining.length)];
    updateProgress();
    inputLocked = false;

    const equippedItems = KISEKAE_ITEMS.filter((item) => equippedIds.includes(item.id));
    const choices = pickChoices(remaining, equippedItems, target);

    if (itemsEl) {
      itemsEl.innerHTML = choices.map((item) => itemButtonHtml(item)).join('');
      itemsEl.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((button) => {
        button.addEventListener('click', () => {
          void handleChoiceTap(button.dataset.choice ?? '');
        });
      });
    }

    void audioManager.playVoiceSeq([`q-kisekae-${target.id}`]);
  }

  async function handleChoiceTap(choiceId: string): Promise<void> {
    if (inputLocked || !choiceId || !target) return;
    inputLocked = true;
    setItemsEnabled(false);

    if (choiceId === target.id) {
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

    if (target) {
      equippedIds = [...equippedIds, target.id];
      updateTrainDisplay();
    }

    questionIndex += 1;
    window.setTimeout(() => nextQuestion(), 900);
  }

  async function handleIncorrect(): Promise<void> {
    await audioManager.playVoice('retry');
    inputLocked = false;
    setItemsEnabled(true);
  }

  updateTrainDisplay();
  nextQuestion();
}
