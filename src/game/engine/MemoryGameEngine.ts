import type { CardDefinition } from "../cards/cardCatalog";
import { createDeck, type MemoryCard } from "../deck/createDeck";

export type GamePhase = "ready" | "playing" | "resolving" | "paused" | "won";
export type FlipResult = "revealed" | "matched" | "mismatched" | "won" | "ignored";

export interface GameSnapshot {
  readonly phase: GamePhase;
  readonly cards: readonly Readonly<MemoryCard>[];
  readonly moves: number;
  readonly matches: number;
  readonly totalPairs: number;
  readonly elapsedMs: number;
}

export class MemoryGameEngine {
  private cards: MemoryCard[] = [];
  private phase: GamePhase = "ready";
  private moves = 0;
  private matches = 0;
  private elapsedBeforeRun = 0;
  private runStartedAt = 0;
  private mismatchTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeCatalog: readonly CardDefinition[];

  constructor(
    private readonly defaultCatalog: readonly CardDefinition[],
    private readonly onChange: () => void = () => undefined,
    private readonly rng: () => number = Math.random,
    private readonly mismatchDelayMs = 850,
  ) {
    this.activeCatalog = defaultCatalog;
  }

  /** Starts or restarts a level. Its catalog is fixed for the whole round. */
  public start(catalog: readonly CardDefinition[] = this.defaultCatalog): void {
    if (catalog.length < 2) throw new Error("A level must contain at least two pairs.");
    this.clearMismatchTimeout();
    this.activeCatalog = catalog;
    this.cards = createDeck(this.activeCatalog, this.rng);
    this.moves = 0;
    this.matches = 0;
    this.elapsedBeforeRun = 0;
    this.runStartedAt = Date.now();
    this.phase = "playing";
    this.onChange();
  }

  public stop(): void {
    this.clearMismatchTimeout();
    this.phase = "ready";
    this.runStartedAt = 0;
    this.elapsedBeforeRun = 0;
    this.cards = [];
    this.moves = 0;
    this.matches = 0;
  }

  public flipCard(cardId: string): FlipResult {
    if (this.phase !== "playing") return "ignored";

    const selected = this.cards.find((card) => card.id === cardId);
    if (!selected || selected.flipped || selected.matched) return "ignored";

    const firstOpenCard = this.cards.find((card) => card.flipped && !card.matched);
    selected.flipped = true;

    if (!firstOpenCard) {
      this.onChange();
      return "revealed";
    }

    this.moves += 1;

    if (firstOpenCard.pairId === selected.pairId) {
      firstOpenCard.matched = true;
      selected.matched = true;
      this.matches += 1;

      if (this.matches === this.activeCatalog.length) {
        this.elapsedBeforeRun = this.getElapsedMs();
        this.runStartedAt = 0;
        this.phase = "won";
        this.onChange();
        return "won";
      }

      this.onChange();
      return "matched";
    }

    this.phase = "resolving";
    const firstId = firstOpenCard.id;
    const secondId = selected.id;

    this.mismatchTimeout = setTimeout(() => {
      for (const card of this.cards) {
        if (card.id === firstId || card.id === secondId) card.flipped = false;
      }
      this.mismatchTimeout = null;
      if (this.phase === "resolving") this.phase = "playing";
      this.onChange();
    }, this.mismatchDelayMs);

    this.onChange();
    return "mismatched";
  }

  public pause(): boolean {
    if (this.phase !== "playing") return false;
    this.elapsedBeforeRun = this.getElapsedMs();
    this.runStartedAt = 0;
    this.phase = "paused";
    this.onChange();
    return true;
  }

  public resume(): boolean {
    if (this.phase !== "paused") return false;
    this.runStartedAt = Date.now();
    this.phase = "playing";
    this.onChange();
    return true;
  }

  public getSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      cards: this.cards.map((card) => ({ ...card })),
      moves: this.moves,
      matches: this.matches,
      totalPairs: this.activeCatalog.length,
      elapsedMs: this.getElapsedMs(),
    };
  }

  private getElapsedMs(): number {
    if (this.runStartedAt === 0) return this.elapsedBeforeRun;
    return this.elapsedBeforeRun + Math.max(0, Date.now() - this.runStartedAt);
  }

  private clearMismatchTimeout(): void {
    if (this.mismatchTimeout !== null) {
      clearTimeout(this.mismatchTimeout);
      this.mismatchTimeout = null;
    }
  }
}
