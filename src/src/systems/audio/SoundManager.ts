export type GameSound = "flip" | "match" | "mismatch" | "win" | "click";

const SOUND_NOTES: Record<GameSound, readonly number[]> = {
  flip: [520],
  match: [660, 880],
  mismatch: [260, 210],
  win: [523, 659, 784, 1047],
  click: [420],
};

/** Tiny synthesized sound effects: no downloaded audio files or third-party library required. */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public play(sound: GameSound): void {
    if (!this.isEnabled || typeof window === "undefined") return;

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;

    try {
      this.audioContext ??= new AudioContextConstructor();
      const context = this.audioContext;
      if (context.state === "suspended") void context.resume();

      const notes = SOUND_NOTES[sound];
      const spacing = sound === "win" ? 0.13 : 0.09;
      const duration = sound === "flip" || sound === "click" ? 0.075 : 0.15;

      notes.forEach((frequency, index) => {
        const startAt = context.currentTime + index * spacing;
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = sound === "mismatch" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.075, startAt + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + duration + 0.015);
      });
    } catch {
      // Audio is an enhancement; a browser audio restriction must never break gameplay.
    }
  }
}
