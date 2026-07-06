import type { Progress } from './types';

const STORAGE_KEY = 'densha-no-sekai-progress';

const INITIAL_PROGRESS: Progress = {
  currentStation: 0,
  loop: 0,
  stamps: [],
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_PROGRESS };
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.currentStation !== 'number' ||
      typeof parsed.loop !== 'number' ||
      !Array.isArray(parsed.stamps)
    ) {
      return { ...INITIAL_PROGRESS };
    }
    return {
      currentStation: parsed.currentStation,
      loop: parsed.loop,
      stamps: parsed.stamps,
    };
  } catch {
    return { ...INITIAL_PROGRESS };
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorageが使えない環境では何もしない
  }
}
