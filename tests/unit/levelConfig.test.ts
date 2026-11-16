import { describe, expect, it } from "vitest";
import { CARD_CATALOG } from "../../src/game/cards/cardCatalog";
import { getLevelCatalog, LEVELS } from "../../src/game/levels/levelConfig";

describe("level configuration", () => {
  it("defines twelve progressively challenging levels", () => {
    expect(LEVELS).toHaveLength(12);
    for (let index = 1; index < LEVELS.length; index += 1) {
      expect(LEVELS[index]!.pairCount).toBeGreaterThanOrEqual(LEVELS[index - 1]!.pairCount);
    }
  });

  it("provides enough unique objects for every level", () => {
    for (const level of LEVELS) {
      const catalog = getLevelCatalog(level.id);
      expect(catalog).toHaveLength(level.pairCount);
      expect(new Set(catalog.map((item) => item.pairId)).size).toBe(level.pairCount);
    }
  });

  it("includes multiple object categories, not only animals", () => {
    expect(new Set(CARD_CATALOG.map((item) => item.category)).size).toBeGreaterThan(5);
  });
});
