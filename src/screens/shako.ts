import { showScreen } from '../app';
import { audioManager } from '../lib/audio';
import { loadProgress, saveProgress } from '../lib/storage';
import { TRAINS } from '../data/trains';
import { trainArtStandaloneSvg } from '../ui/trainArt';

const STYLE_ID = 'shako-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-shako {
      background: linear-gradient(to bottom, #b7e5f8, #e6f6fd);
      overflow-y: auto;
    }

    .shako-count {
      font-size: 22px;
      color: #2b4a63;
      margin: 0;
    }

    .shako-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      width: 100%;
      max-width: 960px;
    }

    .shako-card {
      position: relative;
      min-height: 160px;
      padding: 12px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .shako-card:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }

    .shako-card.is-selected {
      border: 4px solid #3fb8af;
    }

    .shako-card.is-locked {
      pointer-events: none;
    }

    .shako-card-art {
      width: 100%;
    }

    .shako-card-name {
      font-size: 18px;
      font-weight: bold;
      color: #2b4a63;
      text-align: center;
    }

    .shako-card-badge {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  `;
  document.head.appendChild(style);
}

/** 選択中バッジ用の丸+チェックのSVG(絵文字は使わない) */
function selectedBadgeSvg(): string {
  return `
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="#3fb8af" stroke="#ffffff" stroke-width="2" />
      <path d="M 8,14.5 L 12,18.5 L 20,9.5" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

export function renderShakoScreen(root: HTMLElement): void {
  ensureStyle();

  let progress = loadProgress();

  function render(): void {
    progress = loadProgress();

    const cardsHtml = TRAINS.map((train) => {
      const isOwned = progress.unlockedTrains.includes(train.id);
      const isSelected = train.id === progress.selectedTrain;

      if (!isOwned) {
        return `
          <button class="shako-card is-locked" data-train="${train.id}" disabled>
            <div class="shako-card-art" style="filter: grayscale(1) brightness(0.4); opacity: 0.5;">
              ${trainArtStandaloneSvg(train.id)}
            </div>
            <span class="shako-card-name">？？？</span>
          </button>
        `;
      }

      return `
        <button class="shako-card${isSelected ? ' is-selected' : ''}" data-train="${train.id}">
          ${isSelected ? `<span class="shako-card-badge">${selectedBadgeSvg()}</span>` : ''}
          <div class="shako-card-art">${trainArtStandaloneSvg(train.id)}</div>
          <span class="shako-card-name">${train.name}</span>
        </button>
      `;
    }).join('');

    root.innerHTML = `
      <div class="screen screen-shako">
        <h1 class="screen-title">しゃこ</h1>
        <p class="shako-count">あつめた でんしゃ: ${progress.unlockedTrains.length} / ${TRAINS.length}</p>
        <div class="shako-grid">${cardsHtml}</div>
        <button class="back-button" data-back>⬅️ もどる</button>
      </div>
    `;

    root.querySelector('[data-back]')?.addEventListener('click', () => {
      showScreen('map');
    });

    root.querySelectorAll<HTMLButtonElement>('.shako-card:not(.is-locked)').forEach((card) => {
      card.addEventListener('click', () => {
        const trainId = card.dataset.train;
        const train = TRAINS.find((t) => t.id === trainId);
        if (!trainId || !train) return;

        audioManager.play('sfx-tap');
        void audioManager.playFirstAvailable([train.voice]);

        const latest = loadProgress();
        latest.selectedTrain = trainId;
        saveProgress(latest);

        render();
      });
    });
  }

  render();
}
