export type ScreenName =
  | 'title'
  | 'map'
  | 'hiragana'
  | 'kazu'
  | 'kotoba'
  | 'iro'
  | 'oto'
  | 'stamps'
  | 'shako';

export interface Progress {
  version: 2;
  currentStation: number;
  loop: number;
  stamps: string[];
  unlockedTrains: string[];
  selectedTrain: string;
}
