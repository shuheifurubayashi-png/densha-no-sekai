const AUDIO_EXT = 'm4a';

export class AudioManager {
  private cache = new Map<string, HTMLAudioElement>();
  private unlocked = false;

  private resolveUrl(name: string): string {
    return `${import.meta.env.BASE_URL}audio/${name}.${AUDIO_EXT}`;
  }

  private getAudio(name: string): HTMLAudioElement {
    let audio = this.cache.get(name);
    if (!audio) {
      audio = new Audio(this.resolveUrl(name));
      this.cache.set(name, audio);
    }
    return audio;
  }

  /**
   * 無音再生でiOS Safariのオーディオ制限を解除する。
   * ユーザー操作（タップ）のハンドラ内から呼び出すこと。
   */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      const silent = new Audio();
      silent.muted = true;
      silent.play().catch(() => {
        // iOS以外や再生不可の環境では無視する
      });
    } catch (error) {
      console.warn('AudioManager.unlock failed', error);
    }
  }

  preload(names: string[]): void {
    for (const name of names) {
      try {
        this.getAudio(name);
      } catch (error) {
        console.warn(`AudioManager.preload failed: ${name}`, error);
      }
    }
  }

  async play(name: string): Promise<void> {
    try {
      const audio = this.getAudio(name);
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn(`AudioManager.play failed: ${name}`, error);
    }
  }

  async playVoice(name: string): Promise<void> {
    return this.play(name);
  }
}

export const audioManager = new AudioManager();
