import type { Progress } from './types';
import { STARTER_TRAIN_ID, computeUnlockedTrains } from '../data/trains';

const STORAGE_KEY = 'densha-no-sekai-progress';

function createInitialProgress(): Progress {
  return {
    version: 2,
    currentStation: 0,
    loop: 0,
    stamps: [],
    unlockedTrains: [STARTER_TRAIN_ID],
    selectedTrain: STARTER_TRAIN_ID,
  };
}

function isV1Shape(parsed: unknown): parsed is { currentStation: number; loop: number; stamps: string[] } {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    typeof (parsed as Record<string, unknown>).currentStation === 'number' &&
    typeof (parsed as Record<string, unknown>).loop === 'number' &&
    Array.isArray((parsed as Record<string, unknown>).stamps)
  );
}

function isV2Shape(
  parsed: unknown,
): parsed is { currentStation: number; loop: number; stamps: string[]; unlockedTrains: string[]; selectedTrain: string } {
  if (!isV1Shape(parsed)) return false;
  const record = parsed as Record<string, unknown>;
  return (
    record.version === 2 &&
    Array.isArray(record.unlockedTrains) &&
    record.unlockedTrains.every((id) => typeof id === 'string') &&
    typeof record.selectedTrain === 'string'
  );
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialProgress();
    const parsed = JSON.parse(raw);

    if (isV2Shape(parsed)) {
      // v2形式：unlockedTrainsにスターター車両が含まれているか、selectedTrainが解放済みかを保証する
      let unlockedTrains = parsed.unlockedTrains;
      if (!unlockedTrains.includes(STARTER_TRAIN_ID)) {
        unlockedTrains = [STARTER_TRAIN_ID, ...unlockedTrains];
      }
      let selectedTrain = parsed.selectedTrain;
      if (!unlockedTrains.includes(selectedTrain)) {
        selectedTrain = STARTER_TRAIN_ID;
      }
      return {
        version: 2,
        currentStation: parsed.currentStation,
        loop: parsed.loop,
        stamps: parsed.stamps,
        unlockedTrains,
        selectedTrain,
      };
    }

    if (isV1Shape(parsed)) {
      // v1形式：loop/stampsの実績からunlockedTrainsを算出してv2へ移行する
      const migrated: Progress = {
        version: 2,
        currentStation: parsed.currentStation,
        loop: parsed.loop,
        stamps: parsed.stamps,
        unlockedTrains: computeUnlockedTrains(parsed.loop, parsed.stamps.length),
        selectedTrain: STARTER_TRAIN_ID,
      };
      saveProgress(migrated);
      return migrated;
    }

    return createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorageが使えない環境では何もしない
  }
}
