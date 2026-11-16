import { afterEach, describe, expect, it, vi } from "vitest";
import { CARD_CATALOG } from "../../src/game/cards/cardCatalog";
import { MemoryGameEngine } from "../../src/game/engine/MemoryGameEngine";

describe("MemoryGameEngine", () => {
  afterEach(() => vi.useRealTimers());

  it("allows one open card at a time and ignores repeated or blocked input", () => {
    vi.useFakeTimers();
    const engine = new MemoryGameEngine(CARD_CATALOG.slice(0, 3), () => undefined, () => 0.4, 500);
    engine.start(CARD_CATALOG.slice(0, 3));
    const cards = engine.getSnapshot().cards;
    const first = cards[0]!;

    expect(engine.flipCard(first.id)).toBe("revealed");
    expect(engine.flipCard(first.id)).toBe("ignored");
    expect(engine.getSnapshot().moves).toBe(0);
    engine.stop();
  });

  it("resolves a mismatch after the configured delay and blocks third-card input", () => {
    vi.useFakeTimers();
    const engine = new MemoryGameEngine(CARD_CATALOG.slice(0, 3), () => undefined, () => 0.4, 500);
    engine.start(CARD_CATALOG.slice(0, 3));
    const cards = engine.getSnapshot().cards;
    const first = cards[0]!;
    const different = cards.find((card) => card.pairId !== first.pairId)!;
    const third = cards.find((card) => card.id !== first.id && card.id !== different.id)!;

    expect(engine.flipCard(first.id)).toBe("revealed");
    expect(engine.flipCard(different.id)).toBe("mismatched");
    expect(engine.flipCard(third.id)).toBe("ignored");
    expect(engine.getSnapshot().phase).toBe("resolving");

    vi.advanceTimersByTime(500);
    const resolved = engine.getSnapshot();
    expect(resolved.phase).toBe("playing");
    expect(resolved.cards.every((card) => !card.flipped || card.matched)).toBe(true);
    expect(resolved.moves).toBe(1);
    engine.stop();
  });

  it("counts matches and wins only after every pair has been found", () => {
    vi.useFakeTimers();
    const catalog = CARD_CATALOG.slice(0, 2);
    const engine = new MemoryGameEngine(catalog, () => undefined, () => 0.3);
    engine.start(catalog);

    for (const definition of catalog) {
      const pair = engine.getSnapshot().cards.filter((card) => card.pairId === definition.pairId);
      expect(engine.flipCard(pair[0]!.id)).toBe("revealed");
      const result = engine.flipCard(pair[1]!.id);
      if (definition === catalog[catalog.length - 1]) expect(result).toBe("won");
      else expect(result).toBe("matched");
    }

    const finalState = engine.getSnapshot();
    expect(finalState.phase).toBe("won");
    expect(finalState.matches).toBe(2);
    expect(finalState.moves).toBe(2);
    engine.stop();
  });

  it("does not count paused time", () => {
    vi.useFakeTimers();
    const catalog = CARD_CATALOG.slice(0, 2);
    const engine = new MemoryGameEngine(catalog);
    engine.start(catalog);
    vi.advanceTimersByTime(1_000);
    expect(engine.pause()).toBe(true);
    const pausedTime = engine.getSnapshot().elapsedMs;
    vi.advanceTimersByTime(2_000);
    expect(engine.getSnapshot().elapsedMs).toBe(pausedTime);
    expect(engine.resume()).toBe(true);
    vi.advanceTimersByTime(500);
    expect(engine.getSnapshot().elapsedMs).toBe(pausedTime + 500);
    engine.stop();
  });
});
