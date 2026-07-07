export interface TrainDef {
  id: string;
  name: string; // ひらがな表示名
  unlock: { type: 'start' } | { type: 'loop'; loop: number } | { type: 'stamps'; count: number };
  voice: string; // 音声ファイル名 'train-{id}'
}

export const STARTER_TRAIN_ID = 'akai-densha';

export const TRAINS: TrainDef[] = [
  { id: 'akai-densha', name: 'あかいでんしゃ', unlock: { type: 'start' }, voice: 'train-akai-densha' },
  { id: 'midori-densha', name: 'みどりのでんしゃ', unlock: { type: 'loop', loop: 1 }, voice: 'train-midori-densha' },
  { id: 'tokkyuu', name: 'とっきゅう', unlock: { type: 'loop', loop: 2 }, voice: 'train-tokkyuu' },
  { id: 'kamotsu', name: 'かもつれっしゃ', unlock: { type: 'loop', loop: 3 }, voice: 'train-kamotsu' },
  { id: 'shinkansen', name: 'しんかんせん', unlock: { type: 'loop', loop: 4 }, voice: 'train-shinkansen' },
  { id: 'yakou-ressha', name: 'やこうれっしゃ', unlock: { type: 'loop', loop: 5 }, voice: 'train-yakou-ressha' },
  { id: 'kiiroi-densha', name: 'きいろいけんそくでんしゃ', unlock: { type: 'stamps', count: 30 }, voice: 'train-kiiroi-densha' },
  { id: 'kin-no-densha', name: 'きんのでんしゃ', unlock: { type: 'loop', loop: 7 }, voice: 'train-kin-no-densha' },
];

/** loop/stamps 実績から解放済み車両ID一覧を計算する(starter含む) */
export function computeUnlockedTrains(loop: number, stampCount: number): string[] {
  return TRAINS.filter((train) => {
    if (train.unlock.type === 'start') return true;
    if (train.unlock.type === 'loop') return loop >= train.unlock.loop;
    return stampCount >= train.unlock.count;
  }).map((train) => train.id);
}
