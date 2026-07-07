import type { ScreenName } from './lib/types';
import { renderMapScreen } from './screens/map';
import { renderHiraganaScreen } from './screens/hiragana';
import { renderKazuScreen } from './screens/kazu';
import { renderKotobaScreen } from './screens/kotoba';
import { renderIroScreen } from './screens/iro';
import { renderOtoScreen } from './screens/oto';
import { renderStampsScreen } from './screens/stamps';
import { renderShakoScreen } from './screens/shako';

const screenRenderers: Record<Exclude<ScreenName, 'title'>, (root: HTMLElement) => void> = {
  map: renderMapScreen,
  hiragana: renderHiraganaScreen,
  kazu: renderKazuScreen,
  kotoba: renderKotobaScreen,
  iro: renderIroScreen,
  oto: renderOtoScreen,
  stamps: renderStampsScreen,
  shako: renderShakoScreen,
};

export function showScreen(name: ScreenName): void {
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
