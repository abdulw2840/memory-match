/**
 * A gentle, original ambient loop synthesized with Web Audio.
 * It requires a user gesture before starting, as browsers block autoplay.
 */
export class AmbientMusic {
  private context: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private progressionTimer: number | null = null;
  private volume = 0.12;
  private chordIndex = 0;
  private started = false;

  private readonly chords = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66],
  ];

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(0.3, volume));
    if (!this.context) return;
    const now = this.context.currentTime;
    this.gains.forEach((gain, index) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(this.volume * (index === 0 ? 0.23 : 0.13), now, 0.8);
    });
  }

  public start(): void {
    if (typeof window === "undefined" || this.volume <= 0) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume();
      if (!this.started) {
        this.started = true;
        for (let index = 0; index < 3; index += 1) {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = index === 0 ? "sine" : "triangle";
          gain.gain.value = 0.0001;
          oscillator.connect(gain);
          gain.connect(this.context.destination);
          oscillator.start();
          this.oscillators.push(oscillator);
          this.gains.push(gain);
        }
        this.applyChord();
        this.progressionTimer = window.setInterval(() => {
          this.chordIndex = (this.chordIndex + 1) % this.chords.length;
          this.applyChord();
        }, 6500);
      }
      this.setVolume(this.volume);
    } catch {
      // Background music is optional and must never interrupt gameplay.
    }
  }

  private applyChord(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.chords[this.chordIndex]!.forEach((frequency, index) => {
      const oscillator = this.oscillators[index];
      const gain = this.gains[index];
      if (!oscillator || !gain) return;
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setTargetAtTime(frequency, now, 1.8);
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(this.volume * (index === 0 ? 0.23 : 0.13), now, 1.2);
    });
  }

  public destroy(): void {
    if (this.progressionTimer !== null) window.clearInterval(this.progressionTimer);
    this.progressionTimer = null;
    this.oscillators.forEach((oscillator) => oscillator.stop());
    this.oscillators = [];
    this.gains = [];
    this.started = false;
    if (this.context) void this.context.close();
    this.context = null;
  }
}
