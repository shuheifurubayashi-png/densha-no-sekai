const AUDIO_EXT = 'm4a';

export class AudioManager {
  private cache = new Map<string, HTMLAudioElement>();
  private unlocked = false;
  private currentVoice: HTMLAudioElement | null = null;
  private voiceToken = 0;

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

  /**
   * 再生を開始し、再生終了(ended/pause/error/安全タイムアウト)まで待機する。
   */
  private async playToEnd(name: string): Promise<void> {
    try {
      const audio = this.getAudio(name);
      audio.currentTime = 0;
      await audio.play();

      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = (): void => {
          if (settled) return;
          settled = true;
          audio.removeEventListener('ended', finish);
          audio.removeEventListener('pause', finish);
          audio.removeEventListener('error', finish);
          window.clearTimeout(timeoutId);
          resolve();
        };

        const timeoutMs =
          Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 + 1500 : 10000;
        const timeoutId = window.setTimeout(finish, timeoutMs);

        audio.addEventListener('ended', finish);
        audio.addEventListener('pause', finish);
        audio.addEventListener('error', finish);
      });
    } catch (error) {
      console.warn(`AudioManager.play failed: ${name}`, error);
    }
  }

  async play(name: string): Promise<void> {
    return this.playToEnd(name);
  }

  async playVoice(name: string): Promise<void> {
    return this.playVoiceSeq([name]);
  }

  /** 再生中のボイスがあれば停止する(pauseイベントで待機中のplayToEndが即解除される) */
  stopVoice(): void {
    if (this.currentVoice && !this.currentVoice.paused) {
      this.currentVoice.pause();
    }
  }

  private async tryPlay(name: string): Promise<boolean> {
    try {
      await this.playToEnd(name);
      return true;
    } catch (error) {
      console.debug(`AudioManager.tryPlay failed: ${name}`, error);
      return false;
    }
  }

  async playVoiceSeq(names: string[]): Promise<void> {
    const token = ++this.voiceToken;
    this.stopVoice();
    for (const name of names) {
      if (token !== this.voiceToken) return;
      this.currentVoice = this.getAudio(name);
      await this.playToEnd(name);
    }
    if (token === this.voiceToken) this.currentVoice = null;
  }

  async playFirstAvailable(names: string[]): Promise<void> {
    for (const name of names) {
      const played = await this.tryPlay(name);
      if (played) return;
    }
    console.warn(`AudioManager.playFirstAvailable: no playable audio found among ${names.join(', ')}`);
  }
}

export const audioManager = new AudioManager();
