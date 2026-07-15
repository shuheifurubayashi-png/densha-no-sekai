import './styles.css';
import { showScreen, initHistoryGuard } from './app';
import { audioManager } from './lib/audio';

function renderTitleScreen(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="screen screen-title">
      <h1 class="title-heading">でんしゃのせかい</h1>
      <button class="start-button" data-start>
        <span class="start-button-icon">🚃</span>
        <span class="start-button-label">はじめる</span>
      </button>
    </div>
  `;

  app.querySelector('[data-start]')?.addEventListener('click', () => {
    audioManager.unlock();
    audioManager.playVoice('welcome');
    showScreen('map');
  });
}

renderTitleScreen();
initHistoryGuard();

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch((error) => {
      console.warn('PWA registration failed', error);
    });
}
