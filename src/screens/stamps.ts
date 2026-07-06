import { showScreen } from '../app';
import { loadProgress } from '../lib/storage';
import { STATIONS } from '../data/content';

const STYLE_ID = 'stamps-screen-style';

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .screen-stamps {
      background: linear-gradient(to bottom, #87ceeb, #eaf6ff);
      overflow-y: auto;
    }

    .stamps-loop-row {
      font-size: 28px;
      letter-spacing: 4px;
      color: #2b4a63;
    }

    .stamps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 20px;
      width: 100%;
      max-width: 640px;
    }

    .stamps-badge {
      min-width: 120px;
      min-height: 120px;
      border-radius: 50%;
      background-color: #ffffff;
      border: 6px dashed #ff9f43;
      box-shadow: 0 6px 0 #cbd8e0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .stamps-badge-emoji {
      font-size: 40px;
    }

    .stamps-badge-name {
      font-size: 14px;
      color: #2b4a63;
      text-align: center;
    }

    .stamps-empty {
      font-size: 22px;
      color: #2b4a63;
    }

    .stamps-back-button {
      min-width: 100px;
      min-height: 100px;
      border-radius: 24px;
      background-color: #ffffff;
      box-shadow: 0 6px 0 #cbd8e0;
      font-size: 48px;
    }

    .stamps-back-button:active {
      transform: translateY(3px);
      box-shadow: 0 3px 0 #cbd8e0;
    }
  `;
  document.head.appendChild(style);
}

export function renderStampsScreen(root: HTMLElement): void {
  ensureStyle();

  const progress = loadProgress();
  const stationById = new Map<string, (typeof STATIONS)[number]>(
    STATIONS.map((station) => [station.id, station]),
  );

  const badgesHtml = progress.stamps
    .map((stampId) => {
      const station = stationById.get(stampId);
      if (!station) return '';
      return `
        <div class="stamps-badge">
          <span class="stamps-badge-emoji">${station.emoji}</span>
          <span class="stamps-badge-name">${station.name}</span>
        </div>
      `;
    })
    .join('');

  const loopMarks = '🚃'.repeat(Math.max(progress.loop, 0)) || '🚃';

  root.innerHTML = `
    <div class="screen screen-stamps">
      <h1 class="screen-title">🎫 すたんぷちょう</h1>
      <p class="stamps-loop-row">${loopMarks}</p>
      ${
        progress.stamps.length > 0
          ? `<div class="stamps-grid">${badgesHtml}</div>`
          : '<p class="stamps-empty">まだ すたんぷが ないよ</p>'
      }
      <button class="stamps-back-button" data-back aria-label="もどる">⬅️</button>
    </div>
  `;

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    showScreen('map');
  });
}
