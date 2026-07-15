import type { ScreenName } from './lib/types';
import { renderMapScreen } from './screens/map';
import { renderHiraganaScreen } from './screens/hiragana';
import { renderKazuScreen } from './screens/kazu';
import { renderKotobaScreen } from './screens/kotoba';
import { renderIroScreen } from './screens/iro';
import { renderOtoScreen } from './screens/oto';
import { renderStampsScreen } from './screens/stamps';
import { renderShakoScreen } from './screens/shako';
import { renderKatachiScreen } from './screens/katachi';
import { renderKisekaeScreen } from './screens/kisekae';

const screenRenderers: Record<Exclude<ScreenName, 'title'>, (root: HTMLElement) => void> = {
  map: renderMapScreen,
  hiragana: renderHiraganaScreen,
  kazu: renderKazuScreen,
  kotoba: renderKotobaScreen,
  iro: renderIroScreen,
  oto: renderOtoScreen,
  stamps: renderStampsScreen,
  shako: renderShakoScreen,
  katachi: renderKatachiScreen,
  kisekae: renderKisekaeScreen,
};

let currentScreen: ScreenName = 'title';

export function showScreen(name: ScreenName): void {
  currentScreen = name;

  const app = document.getElementById('app');
  if (!app) {
    console.warn('showScreen: #app が見つかりません');
    return;
  }

  app.innerHTML = '';

  if (name === 'title') {
    return;
  }

  screenRenderers[name](app);
}

/** 端末の戻るボタン/スワイプでアプリを離脱せず、マップに戻す */
export function initHistoryGuard(): void {
  history.pushState({ app: true }, '');
  window.addEventListener('popstate', () => {
    history.pushState({ app: true }, '');
    if (currentScreen !== 'map' && currentScreen !== 'title') {
      showScreen('map');
    }
  });
}
