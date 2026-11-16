import { CARD_CATALOG } from "../game/cards/cardCatalog";
import { MemoryGameEngine, type GameSnapshot } from "../game/engine/MemoryGameEngine";
import { SoundManager } from "../systems/audio/SoundManager";

export class App {
  private readonly sound = new SoundManager();
  private readonly engine = new MemoryGameEngine(
    CARD_CATALOG,
    () => this.updateGameUI(),
  );
  private timerId: number | null = null;
  private reducedMotion = false;
  private victoryShown = false;

  constructor(private readonly root: HTMLElement) {}

  public initialize(): void {
    this.renderHome();
    this.root.addEventListener("click", this.handleClick);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  public destroy(): void {
    this.stopTimer();
    this.engine.stop();
    this.root.removeEventListener("click", this.handleClick);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const cardButton = target.closest<HTMLButtonElement>("[data-card-id]");
    if (cardButton) {
      const result = this.engine.flipCard(cardButton.dataset.cardId ?? "");
      if (result !== "ignored") this.playFlipFeedback(result);
      return;
    }

    const actionButton = target.closest<HTMLButtonElement>("[data-action]");
    const action = actionButton?.dataset.action;
    if (!action) return;

    switch (action) {
      case "start":
        this.sound.play("click");
        this.startGame();
        break;
      case "home":
        this.sound.play("click");
        this.goHome();
        break;
      case "restart":
        this.sound.play("click");
        this.startGame();
        break;
      case "pause":
        this.sound.play("click");
        this.engine.pause();
        this.updateGameUI();
        break;
      case "resume":
        this.sound.play("click");
        this.engine.resume();
        this.updateGameUI();
        break;
      case "settings":
        this.sound.play("click");
        this.openSettings();
        break;
      case "close-settings":
        this.sound.play("click");
        this.closeSettings();
        break;
      case "toggle-sound":
        this.sound.setEnabled(!this.sound.enabled);
        this.updateSoundControls();
        if (this.sound.enabled) this.sound.play("click");
        break;
      case "toggle-motion":
        this.reducedMotion = !this.reducedMotion;
        this.root.classList.toggle("motion-reduced", this.reducedMotion);
        this.updateSettingsControls();
        break;
    }
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Do not silently keep a running timer while the player is away.
      this.engine.pause();
      this.updateGameUI();
    }
  };

  private startGame(): void {
    this.victoryShown = false;
    this.engine.start();
    this.renderGame();
    this.updateGameUI();
    this.startTimer();
    this.root.querySelector<HTMLElement>("#game-board")?.focus({ preventScroll: true });
  }

  private goHome(): void {
    this.stopTimer();
    this.engine.stop();
    this.victoryShown = false;
    this.renderHome();
  }

  private renderHome(): void {
    this.root.innerHTML = `
      <main class="adventure home-screen">
        ${this.renderHeader()}
        <section class="welcome">
          <div class="welcome-copy">
            <div class="welcome-label"><span>✦</span> LET'S PLAY! <span>✦</span></div>
            <h1>Ready for a<br><span>memory adventure?</span></h1>
            <p>Flip the cards, find the matching pairs and collect your stars!</p>
            <button class="play-button" type="button" data-action="start">
              <span class="play-icon" aria-hidden="true">▶</span>
              <span>Let's Play!</span>
              <span class="button-sparkle" aria-hidden="true">✦</span>
            </button>
            <p class="welcome-feedback" aria-live="polite">Four pairs are waiting to be found!</p>
          </div>
          <div class="mascot-scene" aria-label="Sunny the smiling sun mascot">
            <div class="sun-rays"></div>
            <div class="mascot" aria-hidden="true">
              <svg viewBox="0 0 220 220">
                <defs><linearGradient id="sunBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE77D"/><stop offset="100%" stop-color="#FFAA37"/></linearGradient></defs>
                <path d="M110 12 124 35 151 22 154 50 183 49 177 77 204 90 185 111 203 133 176 146 181 175 151 171 138 199 113 183 91 204 78 177 48 182 50 152 22 139 39 115 18 92 46 77 40 48 70 51 84 23 110 40Z" fill="#FFBC45"/>
                <circle cx="110" cy="108" r="76" fill="url(#sunBody)"/>
                <ellipse cx="82" cy="108" rx="7" ry="11" fill="#543C46"/><ellipse cx="138" cy="108" rx="7" ry="11" fill="#543C46"/>
                <circle cx="60" cy="126" r="11" fill="#FF8F91" opacity=".7"/><circle cx="160" cy="126" r="11" fill="#FF8F91" opacity=".7"/>
                <path d="M97 132Q110 145 123 132" fill="none" stroke="#543C46" stroke-width="5" stroke-linecap="round"/>
                <path d="M79 74Q90 63 100 72" fill="none" stroke="#FFF" stroke-width="5" stroke-linecap="round" opacity=".65"/>
              </svg>
            </div>
            <span class="scene-star star-one">✦</span><span class="scene-star star-two">★</span><span class="scene-star star-three">✦</span>
            <span class="scene-cloud cloud-one"></span><span class="scene-cloud cloud-two"></span>
            <div class="mascot-caption">Sunny says hello!</div>
          </div>
        </section>
        <section class="game-panel home-info">
          <div class="panel-heading"><div><span class="section-label">HOW TO PLAY</span><h2>Ready, set, remember!</h2></div><div class="level-pill">★ LEVEL 01</div></div>
          <div class="how-to-play">
            <div class="how-step"><span class="step-number step-blue">1</span><strong>Flip a card</strong><small>Tap any card to peek.</small></div>
            <div class="how-step"><span class="step-number step-coral">2</span><strong>Find its twin</strong><small>Remember what you saw.</small></div>
            <div class="how-step"><span class="step-number step-green">3</span><strong>Make a match!</strong><small>Collect all four pairs.</small></div>
          </div>
        </section>
        <footer class="footer"><span>A little game, a big adventure!</span><span class="footer-stars">★ ★ ★</span></footer>
      </main>
    `;
    this.updateSoundControls();
  }

  private renderHeader(): string {
    return `
      <header class="topbar">
        <a class="logo" href="#home" data-action="home" aria-label="Memory Match home">
          <span class="logo-icon">M</span><span>memory<span class="logo-accent">match</span></span>
        </a>
        <div class="topbar-actions">
          <button class="icon-button sound-button" type="button" data-action="toggle-sound" aria-label="Toggle sound" aria-pressed="${this.sound.enabled}">
            ${this.sound.enabled ? this.soundOnIcon() : this.soundOffIcon()}
          </button>
          <button class="icon-button" type="button" data-action="settings" aria-label="Settings">${this.settingsIcon()}</button>
        </div>
      </header>`;
  }

  private renderGame(): void {
    const snapshot = this.engine.getSnapshot();
    this.root.innerHTML = `
      <main class="adventure game-screen">
        ${this.renderHeader()}
        <section class="game-intro-row">
          <div><span class="section-label">SUNNY'S MEMORY GARDEN</span><h1>Find the matching pairs!</h1><p>Turn over two cards. Do they match?</p></div>
          <div class="level-pill">★ LEVEL 01</div>
        </section>
        <section class="game-panel active-game-panel" aria-label="Memory match game">
          <div class="game-hud">
            <div class="hud-stat"><span class="hud-icon moves-icon">↗</span><span><small>MOVES</small><strong class="moves-value">0</strong></span></div>
            <div class="hud-stat"><span class="hud-icon time-icon">◷</span><span><small>TIME</small><strong class="timer-value">00:00</strong></span></div>
            <div class="hud-stat"><span class="hud-icon pairs-icon">★</span><span><small>PAIRS</small><strong class="matches-value">0 / ${snapshot.totalPairs}</strong></span></div>
            <button class="round-control" type="button" data-action="pause" aria-label="Pause game">Ⅱ</button>
          </div>
          <div class="progress-track" role="progressbar" aria-label="Pairs found" aria-valuemin="0" aria-valuemax="${snapshot.totalPairs}" aria-valuenow="0"><span class="progress-fill"></span></div>
          <p class="game-message" aria-live="polite">Find two cards that are the same!</p>
          <div class="cards-grid" id="game-board" role="group" aria-label="Eight memory cards" tabindex="-1">
            ${snapshot.cards.map((card, index) => `
              <button class="memory-card" type="button" data-card-id="${card.id}" aria-label="Card ${index + 1}, face down" aria-pressed="false" style="--card-color:${card.color};--card-order:${index}">
                <span class="card-inner">
                  <span class="card-face card-back" aria-hidden="true"><span class="back-sun">✦</span><span class="back-dots">•••</span></span>
                  <span class="card-face card-front"><span class="card-art">${card.artwork}</span><span class="card-name">${card.name}</span></span>
                </span>
              </button>`).join("")}
          </div>
          <div class="game-actions"><button class="soft-button" type="button" data-action="home">← Home</button><button class="soft-button restart-button" type="button" data-action="restart">↻ Start over</button></div>
        </section>
        <footer class="footer"><span>You've got this!</span><span class="footer-stars">★ ★ ★</span></footer>
      </main>
    `;
    this.updateSoundControls();
  }

  private updateGameUI(): void {
    const board = this.root.querySelector<HTMLElement>("#game-board");
    if (!board) return;

    const snapshot = this.engine.getSnapshot();
    for (const card of snapshot.cards) {
      const button = board.querySelector<HTMLButtonElement>(`[data-card-id="${card.id}"]`);
      if (!button) continue;
      button.classList.toggle("is-flipped", card.flipped || card.matched);
      button.classList.toggle("is-matched", card.matched);
      button.disabled = card.matched;
      button.setAttribute("aria-pressed", String(card.flipped || card.matched));
      button.setAttribute("aria-label", card.matched ? `${card.name}, matched` : card.flipped ? card.name : "Hidden card, reveal it");
    }

    const moves = this.root.querySelector<HTMLElement>(".moves-value");
    const matches = this.root.querySelector<HTMLElement>(".matches-value");
    const timer = this.root.querySelector<HTMLElement>(".timer-value");
    const progress = this.root.querySelector<HTMLElement>(".progress-fill");
    const progressTrack = this.root.querySelector<HTMLElement>(".progress-track");
    const message = this.root.querySelector<HTMLElement>(".game-message");

    if (moves) moves.textContent = String(snapshot.moves);
    if (matches) matches.textContent = `${snapshot.matches} / ${snapshot.totalPairs}`;
    if (timer) timer.textContent = this.formatTime(snapshot.elapsedMs);
    if (progress) progress.style.width = `${(snapshot.matches / snapshot.totalPairs) * 100}%`;
    progressTrack?.setAttribute("aria-valuenow", String(snapshot.matches));

    if (message) {
      const messages: Record<GameSnapshot["phase"], string> = {
        ready: "Ready when you are!",
        playing: "Find two cards that are the same!",
        resolving: "Not quite! Remember those pictures…",
        paused: "Take a little break. Your cards are waiting!",
        won: "You found every pair. Hooray!",
      };
      message.textContent = messages[snapshot.phase];
    }

    if (snapshot.phase === "paused") this.showPauseOverlay();
    else this.removeOverlay("pause-overlay");

    if (snapshot.phase === "won" && !this.victoryShown) {
      this.victoryShown = true;
      this.stopTimer();
      this.sound.play("win");
      this.showVictoryOverlay(snapshot);
    }
  }

  private playFlipFeedback(result: string): void {
    this.sound.play("flip");
    if (result === "matched") this.sound.play("match");
    if (result === "mismatched") this.sound.play("mismatch");
    if (result === "won") {
      this.sound.play("match");
      // updateGameUI also triggers the longer victory jingle.
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      const snapshot = this.engine.getSnapshot();
      const timer = this.root.querySelector<HTMLElement>(".timer-value");
      if (timer) timer.textContent = this.formatTime(snapshot.elapsedMs);
    }, 250);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  private openSettings(): void {
    this.removeOverlay("settings-overlay");
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay settings-overlay";
    overlay.innerHTML = `
      <section class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button class="modal-close" type="button" data-action="close-settings" aria-label="Close settings">×</button>
        <div class="dialog-sparkle">✦</div><h2 id="settings-title">Game settings</h2><p>Make your game feel just right.</p>
        <div class="setting-row"><span><strong>Sound effects</strong><small>Little sounds for flips and matches</small></span><button class="setting-toggle" type="button" data-action="toggle-sound" aria-pressed="${this.sound.enabled}">${this.sound.enabled ? "ON" : "OFF"}</button></div>
        <div class="setting-row"><span><strong>Calm animations</strong><small>Reduce movement and visual effects</small></span><button class="setting-toggle" type="button" data-action="toggle-motion" aria-pressed="${this.reducedMotion}">${this.reducedMotion ? "ON" : "OFF"}</button></div>
        <button class="play-button dialog-done" type="button" data-action="close-settings">All done!</button>
      </section>`;
    this.root.append(overlay);
    overlay.querySelector<HTMLButtonElement>(".modal-close")?.focus();
    this.updateSettingsControls();
  }

  private closeSettings(): void {
    this.removeOverlay("settings-overlay");
  }

  private updateSettingsControls(): void {
    const soundToggle = this.root.querySelector<HTMLButtonElement>('.settings-overlay [data-action="toggle-sound"]');
    if (soundToggle) {
      soundToggle.textContent = this.sound.enabled ? "ON" : "OFF";
      soundToggle.setAttribute("aria-pressed", String(this.sound.enabled));
    }
    const motionToggle = this.root.querySelector<HTMLButtonElement>('[data-action="toggle-motion"]');
    if (motionToggle) {
      motionToggle.textContent = this.reducedMotion ? "ON" : "OFF";
      motionToggle.setAttribute("aria-pressed", String(this.reducedMotion));
    }
    this.updateSoundControls();
  }

  private updateSoundControls(): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('.sound-button, [data-action="toggle-sound"]')) {
      if (button.classList.contains("sound-button")) {
        button.innerHTML = this.sound.enabled ? this.soundOnIcon() : this.soundOffIcon();
        button.setAttribute("aria-pressed", String(this.sound.enabled));
        button.setAttribute("aria-label", this.sound.enabled ? "Mute sound" : "Turn sound on");
      }
    }
    const modalToggle = this.root.querySelector<HTMLButtonElement>('.settings-overlay [data-action="toggle-sound"]');
    if (modalToggle) {
      modalToggle.textContent = this.sound.enabled ? "ON" : "OFF";
      modalToggle.setAttribute("aria-pressed", String(this.sound.enabled));
    }
  }

  private showPauseOverlay(): void {
    if (this.root.querySelector(".pause-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay pause-overlay";
    overlay.innerHTML = `
      <section class="settings-dialog pause-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <div class="dialog-sparkle">☁</div><h2 id="pause-title">Time for a break?</h2><p>Your game is paused. Your cards are right where you left them.</p>
        <button class="play-button dialog-done" type="button" data-action="resume">▶ Keep playing</button>
        <button class="soft-button" type="button" data-action="restart">Start this level again</button>
      </section>`;
    this.root.append(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-action="resume"]')?.focus();
  }

  private showVictoryOverlay(snapshot: GameSnapshot): void {
    if (this.root.querySelector(".victory-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay victory-overlay";
    const confetti = Array.from({ length: 32 }, (_, index) =>
      `<i class="confetti-piece" style="--x:${(index * 37) % 100}%;--delay:${(index % 8) * 0.09}s;--hue:${(index * 47) % 360}"></i>`,
    ).join("");
    overlay.innerHTML = `
      <div class="confetti-field" aria-hidden="true">${confetti}</div>
      <section class="settings-dialog victory-dialog" role="dialog" aria-modal="true" aria-labelledby="victory-title">
        <div class="trophy">★</div><span class="section-label">ALL PAIRS FOUND</span><h2 id="victory-title">You did it!</h2><p>Sunny is so proud of you. What a super memory!</p>
        <div class="victory-stats"><span><strong>${snapshot.moves}</strong><small>Moves</small></span><span><strong>${this.formatTime(snapshot.elapsedMs)}</strong><small>Time</small></span><span><strong>${snapshot.matches}/${snapshot.totalPairs}</strong><small>Pairs</small></span></div>
        <button class="play-button dialog-done" type="button" data-action="restart">Play again!</button>
        <button class="soft-button" type="button" data-action="home">Back home</button>
      </section>`;
    this.root.append(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-action="restart"]')?.focus();
  }

  private removeOverlay(className: string): void {
    this.root.querySelector(`.${className}`)?.remove();
  }

  private settingsIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.9h-3l-.3-1.9a8 8 0 0 1-1.7-1l-1.7.7-1.5-2.6 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.5-2.6 1.7.7a8 8 0 0 1 1.7-1l.3-1.9h3l.3 1.9a8 8 0 0 1 1.7 1l1.7-.7 1.5 2.6-1.4 1.1a8 8 0 0 1 0 2Z"/></svg>`;
  }

  private soundOnIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>`;
  }

  private soundOffIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l8 5V4Z"/><path d="m17 9 5 6m0-6-5 6"/></svg>`;
  }
}
