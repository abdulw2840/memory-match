import type { CardDefinition } from "../cards/cardCatalog";

export interface MemoryCard {
  readonly id: string;
  readonly pairId: string;
  readonly name: string;
  readonly artwork: string;
  readonly color: string;
  flipped: boolean;
  matched: boolean;
}

/** Fisher-Yates shuffle. Injecting rng makes deck generation deterministic in tests. */
export function createDeck(
  catalog: readonly CardDefinition[],
  rng: () => number = Math.random,
): MemoryCard[] {
  if (catalog.length < 2) {
    throw new Error("A memory game needs at least two different pairs.");
  }

  const pairIds = new Set(catalog.map((item) => item.pairId));
  if (pairIds.size !== catalog.length) {
    throw new Error("Every card definition must have a unique pairId.");
  }

  const cards = catalog.flatMap((item) =>
    [0, 1].map((copy) => ({
      id: `${item.pairId}-${copy + 1}`,
      pairId: item.pairId,
      name: item.name,
      artwork: item.artwork,
      color: item.color,
      flipped: false,
      matched: false,
    })),
  );

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomValue = rng();
    const safeRandom = Math.min(Math.max(randomValue, 0), 0.999999999);
    const swapIndex = Math.floor(safeRandom * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex]!, cards[index]!];
  }

  return cards;
}
