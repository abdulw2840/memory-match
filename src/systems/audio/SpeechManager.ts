/** Uses the browser's built-in speech synthesis; no external service or audio assets required. */
export class SpeechManager {
  public get supported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  public speakMatch(name: string, initial: string): void {
    if (!this.supported) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${initial} is for ${name}!`);
      utterance.lang = "en-US";
      utterance.rate = 0.88;
      utterance.pitch = 1.12;
      utterance.volume = 1;

      const englishVoice = window.speechSynthesis.getVoices().find((voice) =>
        voice.lang.toLowerCase().startsWith("en"),
      );
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech is optional; browser audio restrictions must never interrupt game logic.
    }
  }

  public stop(): void {
    if (this.supported) window.speechSynthesis.cancel();
  }
}
