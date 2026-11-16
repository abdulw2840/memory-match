import { CARD_CATALOG, type CardCategory, type CardDefinition } from "../cards/cardCatalog";

export interface LevelDefinition {
  readonly id: number;
  readonly title: string;
  readonly subtitle: string;
  readonly pairCount: number;
  readonly categories: readonly CardCategory[] | "all";
  readonly columns: number;
  readonly world: string;
}

export const LEVELS: readonly LevelDefinition[] = [
  { id: 1, title: "Sunny Start", subtitle: "A little bit of everything", pairCount: 4, categories: "all", columns: 4, world: "Sunny Meadow" },
  { id: 2, title: "Yummy Finds", subtitle: "Fruit and tasty treats", pairCount: 4, categories: ["food"], columns: 4, world: "Yummy Valley" },
  { id: 3, title: "Go, Go, Go!", subtitle: "Things that go", pairCount: 5, categories: ["vehicles", "space"], columns: 5, world: "Zoom Town" },
  { id: 4, title: "Wild Friends", subtitle: "Animals big and small", pairCount: 6, categories: ["animals", "ocean"], columns: 4, world: "Wild Woods" },
  { id: 5, title: "Nature Wonders", subtitle: "Beautiful things outside", pairCount: 6, categories: ["nature", "space"], columns: 4, world: "Wonder Garden" },
  { id: 6, title: "Playtime Party", subtitle: "Toys and music makers", pairCount: 7, categories: ["toys", "music"], columns: 4, world: "Play Park" },
  { id: 7, title: "Cosy Corners", subtitle: "Things around the home", pairCount: 8, categories: ["home", "food"], columns: 4, world: "Cosy Corner" },
  { id: 8, title: "Ocean Splash", subtitle: "Meet the sea creatures", pairCount: 8, categories: ["ocean", "animals"], columns: 4, world: "Splash Bay" },
  { id: 9, title: "Mixed-Up Magic", subtitle: "A surprise from every world", pairCount: 10, categories: "all", columns: 5, world: "Magic Mountain" },
  { id: 10, title: "Big Adventure", subtitle: "Explore, travel and discover", pairCount: 10, categories: ["vehicles", "space", "nature"], columns: 5, world: "Adventure Isles" },
  { id: 11, title: "Super Finder", subtitle: "A bigger collection to remember", pairCount: 12, categories: "all", columns: 6, world: "Wonder Woods" },
  { id: 12, title: "Memory Master", subtitle: "The grand memory challenge", pairCount: 14, categories: "all", columns: 7, world: "Rainbow Kingdom" },
] as const;

function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

/** Selects unique objects for a level; createDeck duplicates each into exactly one pair. */
export function getLevelCatalog(levelId: number): readonly CardDefinition[] {
  const level = LEVELS.find((item) => item.id === levelId) ?? LEVELS[0]!;
  const pool = level.categories === "all"
    ? [...CARD_CATALOG]
    : CARD_CATALOG.filter((card) => level.categories.includes(card.category));
  const selected = shuffle(pool);

  if (selected.length < level.pairCount) {
    const remaining = CARD_CATALOG.filter((card) => !selected.some((picked) => picked.pairId === card.pairId));
    selected.push(...shuffle(remaining));
  }

  if (selected.length < level.pairCount) {
    throw new Error(`Level ${level.id} needs ${level.pairCount} unique card definitions.`);
  }

  return selected.slice(0, level.pairCount);
}

export function getLevel(levelId: number): LevelDefinition {
  return LEVELS.find((item) => item.id === levelId) ?? LEVELS[0]!;
}
