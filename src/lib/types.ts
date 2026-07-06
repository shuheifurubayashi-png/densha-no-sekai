export type ScreenName = 'title' | 'map' | 'hiragana' | 'kazu' | 'kotoba' | 'stamps';

export interface Progress {
  currentStation: number;
  loop: number;
  stamps: string[];
}
