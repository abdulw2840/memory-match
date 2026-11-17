import { CARD_CATALOG } from "../game/cards/cardCatalog";
import { MemoryGameEngine, type GameSnapshot } from "../game/engine/MemoryGameEngine";
import { getLevel, getLevelCatalog, LEVELS } from "../game/levels/levelConfig";
import { SoundManager } from "../systems/audio/SoundManager";
import { SpeechManager } from "../systems/audio/SpeechManager";
import { ProgressStore, type ProgressData } from "../systems/storage/ProgressStore";

export class App {
  private readonly sound = new SoundManager();
  private readonly speech = new SpeechManager();
  private debugUnlocked = false;
  private readonly progressStore = new ProgressStore();
  private progress: ProgressData = this.progressStore.load();
  private readonly engine = new MemoryGameEngine(
    CARD_CATALOG,
    () => this.updateGameUI(),
  );
  private timerId: number | null = null;
  private reducedMotion = false;
  private victoryShown = false;
  private currentLevelId = 1;

  constructor(private readonly root: HTMLElement) {}

  public initialize(): void {
    this.renderHome();
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("input", this.handleInput);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("resize", this.handleResize, { passive: true });
  }

  public destroy(): void {
    this.stopTimer();
    this.speech.stop();
    this.engine.stop();
    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("input", this.handleInput);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("resize", this.handleResize);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const cardButton = target.closest<HTMLButtonElement>("[data-card-id]");
    if (cardButton) {
      const cardId = cardButton.dataset.cardId ?? "";
      const card = this.engine.getSnapshot().cards.find((item) => item.id === cardId);
      const result = this.engine.flipCard(cardId);
      if (result !== "ignored") this.playFlipFeedback(result, card);
      return;
    }

    const actionButton = target.closest<HTMLButtonElement>("[data-action]");
    const action = actionButton?.dataset.action;
    if (!action) return;

    switch (action) {
      case "start":
        this.sound.play("click");
        this.startGame(this.getNextPlayableLevel());
        break;
      case "play-level": {
        const levelId = Number(actionButton.dataset.level);
        if (Number.isInteger(levelId) && this.isLevelUnlocked(levelId)) {
          this.sound.play("click");
            this.startGame(levelId);
        }
        break;
      }
      case "home":
        this.sound.play("click");
        this.goHome();
        break;
      case "restart":
        this.sound.play("click");
        this.startGame(this.currentLevelId);
        break;
      case "next-level":
        this.sound.play("click");
        this.startGame(Math.min(this.currentLevelId + 1, LEVELS.length));
        break;
      case "pause":
        this.sound.play("click");
        if (this.engine.pause()) this.stopTimer();
        this.updateGameUI();
        break;
      case "resume":
        this.sound.play("click");
        if (this.engine.resume()) this.startTimer();
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
        if (!this.sound.enabled) this.speech.stop();
        this.updateSettingsControls();
        if (this.sound.enabled) this.sound.play("click");
        break;
      case "unlock-debug": {
        const pin = this.root.querySelector<HTMLInputElement>("[data-debug-pin]")?.value ?? "";
        const feedback = this.root.querySelector<HTMLElement>("[data-debug-feedback]");
        if (pin === "1234") {
          this.debugUnlocked = true;
          if (feedback) feedback.textContent = "Developer mode unlocked.";
          this.updateDebugControls();
          this.renderHome();
          this.openSettings();
        } else if (feedback) {
          feedback.textContent = "That PIN is not correct. Try again.";
        }
        break;
      }
      case "debug-unlock-all":
        if (this.debugUnlocked) {
          // Debug access bypasses progression without falsifying player completion records.
          this.renderHome();
          this.openSettings();
        }
        break;
      case "select-avatar": {
        const avatarId = actionButton.dataset.avatar ?? "sunny";
        if (this.getAvailableAvatars().some((avatar) => avatar.id === avatarId)) {
          this.progress = { ...this.progress, selectedAvatar: avatarId };
          this.progressStore.save(this.progress);
          this.renderHome();
        }
        break;
      }
      case "toggle-motion":
        this.reducedMotion = !this.reducedMotion;
        this.root.classList.toggle("motion-reduced", this.reducedMotion);
        this.updateSettingsControls();
        break;
    }
  };

  private readonly handleInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden && this.engine.pause()) {
      this.stopTimer();
      this.updateGameUI();
    }
  };

  private readonly handleResize = (): void => {
    const board = this.root.querySelector<HTMLElement>("#game-board");
    if (board) board.style.setProperty("--board-columns", String(this.getBoardColumns()));
  };

  private startGame(levelId: number): void {
    this.stopTimer();
    this.speech.stop();
    this.victoryShown = false;
    this.currentLevelId = Math.min(Math.max(levelId, 1), LEVELS.length);
    this.engine.start(getLevelCatalog(this.currentLevelId));
    this.renderGame();
    this.updateGameUI();
    this.startTimer();
    this.root.querySelector<HTMLElement>("#game-board")?.focus({ preventScroll: true });
  }

  private goHome(): void {
    this.stopTimer();
    this.speech.stop();
    this.engine.stop();
    this.victoryShown = false;
    this.renderHome();
  }

  private getUnlockedLevel(): number {
    const completed = new Set(this.progress.completedLevels);
    let unlocked = 1;
    while (completed.has(unlocked) && unlocked < LEVELS.length) unlocked += 1;
    return unlocked;
  }

  private getNextPlayableLevel(): number {
    const completed = new Set(this.progress.completedLevels);
    return LEVELS.find((level) => !completed.has(level.id))?.id ?? LEVELS.length;
  }

  private isLevelUnlocked(levelId: number): boolean {
    return this.debugUnlocked || (levelId >= 1 && levelId <= this.getUnlockedLevel());
  }

  private getAvatarCatalog(): ReadonlyArray<{ id: string; name: string; emoji: string; unlockAt: number }> {
    return [
      { id: "sunny", name: "Sunny", emoji: "☀️", unlockAt: 0 },
      { id: "bunny", name: "Bubbles", emoji: "🐰", unlockAt: 1 },
      { id: "fox", name: "Foxy", emoji: "🦊", unlockAt: 3 },
      { id: "panda", name: "Pip", emoji: "🐼", unlockAt: 5 },
      { id: "cat", name: "Mittens", emoji: "🐱", unlockAt: 7 },
      { id: "dragon", name: "Spark", emoji: "🐉", unlockAt: 9 },
      { id: "unicorn", name: "Twinkle", emoji: "🦄", unlockAt: 12 },
    ];
  }

  private getAvailableAvatars() {
    // Developer mode bypasses avatar rewards as well as level progression,
    // without changing the player's saved completion history.
    if (this.debugUnlocked) return this.getAvatarCatalog();
    const completed = this.progress.completedLevels.length;
    return this.getAvatarCatalog().filter((avatar) => avatar.unlockAt === 0 || completed >= avatar.unlockAt);
  }

  private renderSelectedAvatar(): string {
    const available = this.getAvailableAvatars();
    const avatar = available.find((item) => item.id === this.progress.selectedAvatar) ?? available[0]!;
    if (avatar.id === "sunny") return `<div class="hero-sun" aria-hidden="true"><svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="82" fill="#FFD15B"/><path d="M110 8 126 35 155 20 158 51 190 45 181 77 211 95 188 116 210 143 178 153 183 185 151 177 133 207 110 186 87 207 69 177 37 185 42 153 10 143 32 116 9 95 39 77 30 45 62 51 65 20 94 35Z" fill="#FFBF45"/><ellipse cx="82" cy="106" rx="7" ry="11" fill="#634344"/><ellipse cx="139" cy="106" rx="7" ry="11" fill="#634344"/><circle cx="61" cy="128" r="11" fill="#FF8D98"/><circle cx="159" cy="128" r="11" fill="#FF8D98"/><path d="M94 132q16 18 32 0" fill="none" stroke="#634344" stroke-width="5" stroke-linecap="round"/></svg></div>`;
    return `<div class="hero-avatar" role="img" aria-label="${avatar.name}"><span>${avatar.emoji}</span><small>${avatar.name}</small></div>`;
  }

  private renderAvatarRewards(): string {
    const available = this.getAvailableAvatars();
    const selected = available.find((avatar) => avatar.id === this.progress.selectedAvatar) ?? available[0]!;
    return `<section class="avatar-rewards"><div class="avatar-rewards-heading"><div><span class="section-label">COLLECT YOUR FRIENDS</span><h2>My buddies</h2><p>Finish levels to win new characters!</p></div><span class="avatar-count">${available.length}/${this.getAvatarCatalog().length} unlocked</span></div><div class="avatar-collection">${this.getAvatarCatalog().map((avatar) => { const unlocked = available.some((item) => item.id === avatar.id); const active = selected.id === avatar.id; return `<button class="avatar-reward ${unlocked ? "is-unlocked" : "is-locked"} ${active ? "is-selected" : ""}" type="button" ${unlocked ? `data-action="select-avatar" data-avatar="${avatar.id}"` : "disabled"} aria-label="${unlocked ? `Use ${avatar.name}` : `Unlock ${avatar.name} after ${avatar.unlockAt} levels`}"><span>${unlocked ? avatar.emoji : "🔒"}</span><small>${unlocked ? avatar.name : `${avatar.unlockAt} levels`}</small></button>`; }).join("")}</div></section>`;
  }

  private renderHome(): void {
    const nextLevel = this.getNextPlayableLevel();
    const completedCount = this.progress.completedLevels.length;
    const progressPercent = Math.round((completedCount / LEVELS.length) * 100);

    this.root.innerHTML = `
      <main class="adventure home-screen">
        ${this.renderHeader()}

        <section class="home-hero">
          <div class="hero-copy">
            <div class="welcome-label"><span>✦</span> A WORLD OF FUN <span>✦</span></div>
            <h1>Let's play<br><span>and discover!</span></h1>
            <p>Find picture pairs, meet new things and make every match count.</p>
            <button class="play-button hero-play" type="button" data-action="start" aria-label="Play level ${nextLevel}">
              <span class="play-main"><span class="play-icon" aria-hidden="true">▶</span><strong>Play</strong></span>
              <small class="play-level-hint">Level ${nextLevel}</small>
            </button>
            <div class="home-progress" aria-label="${completedCount} of ${LEVELS.length} levels completed">
              <div class="home-progress-label"><strong>Your adventure</strong><span>${completedCount} / ${LEVELS.length} levels</span></div>
              <div class="home-progress-track"><span style="width:${progressPercent}%"></span></div>
            </div>
          </div>

          <div class="hero-art" aria-label="Your selected game buddy">
            <div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div>
            ${this.renderSelectedAvatar()}
            <span class="hero-float float-star">★</span><span class="hero-float float-cloud">☁</span><span class="hero-float float-rainbow">✦</span>
            <div class="speech-bubble">Hi, friend! <span>☀</span></div>
          </div>
          <div class="hero-ground" aria-hidden="true"></div>
        </section>

        ${this.renderAvatarRewards()}

        <section class="level-section">
          <div class="level-section-heading">
            <div><span class="section-label">PICK YOUR NEXT ADVENTURE</span><h2>Choose a level</h2><p>Finish a level to unlock the next one!</p></div>
            <div class="level-trophy">🏆 <strong>${completedCount}/${LEVELS.length}</strong></div>
          </div>
          <div class="level-grid">
            ${LEVELS.map((level) => {
              const completed = this.progress.completedLevels.includes(level.id);
              const unlocked = this.isLevelUnlocked(level.id);
              const current = level.id === nextLevel && !completed;
              const status = completed ? "✓" : unlocked ? String(level.id).padStart(2, "0") : "🔒";
              return `<button class="level-tile ${completed ? "is-complete" : ""} ${current ? "is-current" : ""} ${!unlocked ? "is-locked" : ""}" type="button" data-action="play-level" data-level="${level.id}" ${unlocked ? "" : "disabled"} aria-label="Level ${level.id}: ${level.title}${completed ? ", completed" : unlocked ? ", unlocked" : ", locked"}">
                <span class="level-tile-number">${status}</span>
                <span class="level-tile-copy"><strong>${level.title}</strong><small>${level.pairCount} pairs · ${level.world}</small></span>
                <span class="level-tile-star">${completed ? "★" : current ? "▶" : unlocked ? "☆" : ""}</span>
              </button>`;
            }).join("")}
          </div>
        </section>

        <footer class="footer"><span>Made for curious minds, little and big.</span><span class="footer-stars">★ ★ ★</span></footer>
      </main>`;
    this.updateSoundControls();
  }

  private renderHeader(): string {
    return `
      <header class="topbar">
        <a class="logo" href="#home" data-action="home" aria-label="Memory Match home"><span class="logo-icon">M</span><span>memory<span class="logo-accent">match</span></span></a>
        <div class="topbar-center"><span class="topbar-sparkle">✦</span> PLAY · MATCH · DISCOVER <span class="topbar-sparkle">✦</span></div>
        <div class="topbar-actions">
          <button class="icon-button sound-button" type="button" data-action="toggle-sound" aria-label="Toggle sound and spoken words" aria-pressed="${this.sound.enabled}">${this.sound.enabled ? this.soundOnIcon() : this.soundOffIcon()}</button>
          <button class="icon-button" type="button" data-action="settings" aria-label="Settings">${this.settingsIcon()}</button>
        </div>
      </header>`;
  }

  private renderGame(): void {
    const snapshot = this.engine.getSnapshot();
    const level = getLevel(this.currentLevelId);
    this.root.innerHTML = `
      <main class="adventure game-screen">
        ${this.renderHeader()}
        <section class="game-intro-row">
          <div><span class="section-label">${level.world.toUpperCase()}</span><h1>${level.title}</h1><p>${level.subtitle}. Find every matching pair!</p></div>
          <div class="level-pill">★ LEVEL ${String(level.id).padStart(2, "0")}</div>
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
          <div class="cards-grid" id="game-board" role="group" aria-label="${snapshot.cards.length} memory cards" tabindex="-1" style="--board-columns:${this.getBoardColumns()}">
            ${snapshot.cards.map((card, index) => `
              <button class="memory-card" type="button" data-card-id="${card.id}" aria-label="Card ${index + 1}, face down" aria-pressed="false" style="--card-color:${card.color};--card-order:${index}">
                <span class="card-inner">
                  <span class="card-face card-back" aria-hidden="true"><span class="back-sun">✦</span><span class="back-dots">•••</span></span>
                  <span class="card-face card-front"><span class="card-letter" aria-hidden="true">${card.initial}</span><span class="card-art">${card.artwork}</span><span class="card-name">${card.name}</span></span>
                </span>
              </button>`).join("")}
          </div>
          <div class="game-actions">
            <button class="game-action-button home-action" type="button" data-action="home"><span aria-hidden="true">⌂</span><strong>Home</strong><small>Choose a level</small></button>
            <button class="game-action-button restart-action" type="button" data-action="restart"><span aria-hidden="true">↻</span><strong>Play again</strong><small>Restart this level</small></button>
          </div>
        </section>
        <footer class="footer"><span>Match a pair to hear its name!</span><span class="footer-stars">★ ★ ★</span></footer>
      </main>`;
    this.updateSoundControls();
  }

  private getBoardColumns(): number {
    const columns = getLevel(this.currentLevelId).columns;
    if (window.innerWidth <= 430) return Math.min(columns, 4);
    if (window.innerWidth <= 760) return Math.min(columns, 5);
    return columns;
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
      button.setAttribute("aria-label", card.matched ? `${card.name}, matched` : card.flipped ? `${card.name}` : "Hidden card, reveal it");
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

    if (message && snapshot.phase !== "won") {
      const messages: Record<GameSnapshot["phase"], string> = {
        ready: "Ready when you are!",
        playing: "Find two cards that are the same!",
        resolving: "Not quite! Remember those pictures…",
        paused: "Take a little break. Your cards are waiting!",
        won: "You found every pair. Hooray!",
      };
      if (!message.dataset.matchMessage) message.textContent = messages[snapshot.phase];
    }

    if (snapshot.phase === "paused") {
      this.stopTimer();
      this.showPauseOverlay();
    } else {
      this.removeOverlay("pause-overlay");
    }

    if (snapshot.phase === "won" && !this.victoryShown) {
      this.victoryShown = true;
      this.stopTimer();
      this.saveLevelCompletion(snapshot);
      this.sound.play("win");
      this.showVictoryOverlay(snapshot);
    }
  }

  private playFlipFeedback(
    result: string,
    card?: Readonly<{ name: string; initial: string }>,
  ): void {
    this.sound.play("flip");
    const message = this.root.querySelector<HTMLElement>(".game-message");
    if (result === "matched" || result === "won") {
      this.sound.play("match");
      if (card) {
        if (message) {
          message.textContent = `${card.name}!`;
          message.dataset.matchMessage = "true";
        }
        if (this.sound.enabled) this.speech.speakMatch(card.name);
      }
    } else if (result === "mismatched") {
      this.sound.play("mismatch");
      if (message) {
        message.textContent = "Not quite! Remember those pictures…";
        message.removeAttribute("data-match-message");
      }
    } else if (result === "revealed" && message) {
      message.textContent = "Find this picture's matching friend!";
      message.removeAttribute("data-match-message");
    }
  }

  private saveLevelCompletion(snapshot: GameSnapshot): void {
    const completedLevels = new Set(this.progress.completedLevels);
    completedLevels.add(this.currentLevelId);
    const key = String(this.currentLevelId);
    const bestMoves = { ...this.progress.bestMoves };
    const bestTimes = { ...this.progress.bestTimes };
    bestMoves[key] = Math.min(bestMoves[key] ?? Number.POSITIVE_INFINITY, snapshot.moves);
    bestTimes[key] = Math.min(bestTimes[key] ?? Number.POSITIVE_INFINITY, snapshot.elapsedMs);
    this.progress = {
      completedLevels: [...completedLevels].sort((a, b) => a - b),
      bestMoves,
      bestTimes,
      selectedAvatar: this.progress.selectedAvatar,
    };
    this.progressStore.save(this.progress);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      const snapshot = this.engine.getSnapshot();
      const timer = this.root.querySelector<HTMLElement>(".timer-value");
      if (timer) timer.textContent = this.formatTime(snapshot.elapsedMs);
      if (snapshot.phase !== "playing" && snapshot.phase !== "resolving") this.stopTimer();
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
        <div class="dialog-sparkle">✦</div><h2 id="settings-title">Game settings</h2><p>Make your adventure feel just right.</p>
        <div class="setting-row"><span><strong>Sounds & spoken words</strong><small>Hear flips, matches and object names</small></span><button class="setting-toggle" type="button" data-action="toggle-sound" aria-pressed="${this.sound.enabled}">${this.sound.enabled ? "ON" : "OFF"}</button></div>
        <div class="setting-row"><span><strong>Calm animations</strong><small>Reduce movement and visual effects</small></span><button class="setting-toggle" type="button" data-action="toggle-motion" aria-pressed="${this.reducedMotion}">${this.reducedMotion ? "ON" : "OFF"}</button></div>
        <div class="debug-section">
          <div class="debug-heading"><strong>Developer debugging</strong><small>Unlock every level and avatar for testing</small></div>
          ${this.debugUnlocked ? `<p class="debug-unlocked">All levels and all buddies are unlocked for testing.</p><button class="soft-button debug-unlock-all" type="button" data-action="debug-unlock-all">View unlocked content</button>` : `<div class="debug-pin-row"><input data-debug-pin type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" aria-label="Developer PIN"><button class="soft-button" type="button" data-action="unlock-debug">Unlock</button></div><small class="debug-feedback" data-debug-feedback aria-live="polite"></small>`}
        </div>
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

  private updateDebugControls(): void {
    const section = this.root.querySelector<HTMLElement>(".debug-section");
    if (!section) return;
    section.innerHTML = this.debugUnlocked
      ? `<div class="debug-heading"><strong>Developer debugging</strong><small>Unlock every level and avatar for testing</small></div><p class="debug-unlocked">All levels and all buddies are unlocked for testing.</p><button class="soft-button debug-unlock-all" type="button" data-action="debug-unlock-all">View unlocked content</button>`
      : section.innerHTML;
  }

  private updateSoundControls(): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(".sound-button")) {
      button.innerHTML = this.sound.enabled ? this.soundOnIcon() : this.soundOffIcon();
      button.setAttribute("aria-pressed", String(this.sound.enabled));
      button.setAttribute("aria-label", this.sound.enabled ? "Mute sound and spoken words" : "Turn sound and spoken words on");
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
        <button class="soft-button" type="button" data-action="home">Back to home</button>
      </section>`;
    this.root.append(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-action="resume"]')?.focus();
  }

  private showVictoryOverlay(snapshot: GameSnapshot): void {
    if (this.root.querySelector(".victory-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay victory-overlay";
    const confetti = Array.from({ length: 40 }, (_, index) =>
      `<i class="confetti-piece" style="--x:${(index * 37) % 100}%;--delay:${(index % 8) * 0.09}s;--hue:${(index * 47) % 360}"></i>`,
    ).join("");
    const hasNextLevel = this.currentLevelId < LEVELS.length;
    overlay.innerHTML = `
      <div class="confetti-field" aria-hidden="true">${confetti}</div>
      <section class="settings-dialog victory-dialog" role="dialog" aria-modal="true" aria-labelledby="victory-title">
        <div class="trophy">★</div><span class="section-label">LEVEL ${String(this.currentLevelId).padStart(2, "0")} COMPLETE</span><h2 id="victory-title">You did it!</h2><p>Your buddy is cheering! You found every pair!</p>
        <div class="victory-stats"><span><strong>${snapshot.moves}</strong><small>Moves</small></span><span><strong>${this.formatTime(snapshot.elapsedMs)}</strong><small>Time</small></span><span><strong>${snapshot.matches}/${snapshot.totalPairs}</strong><small>Pairs</small></span></div>
        ${(() => { const reward = this.getAvatarCatalog().find((avatar) => avatar.unlockAt > 0 && avatar.unlockAt === this.progress.completedLevels.length); return reward ? `<div class="avatar-unlock-reward"><span>${reward.emoji}</span><div><strong>New buddy unlocked!</strong><small>${reward.name} is ready to play with you</small></div></div>` : ""; })()}
        <button class="play-button dialog-done" type="button" data-action="${hasNextLevel ? "next-level" : "restart"}">${hasNextLevel ? "Next level! →" : "Play again!"}</button>
        <button class="soft-button" type="button" data-action="home">Choose another level</button>
      </section>`;
    this.root.append(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-action="next-level"], [data-action="restart"]')?.focus();
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
