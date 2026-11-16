import { describe, expect, it } from "vitest";
import { CARD_CATALOG } from "../../src/game/cards/cardCatalog";
import { createDeck } from "../../src/game/deck/createDeck";

describe("createDeck", () => {
  it("creates exactly two cards for every object definition", () => {
    const definitions = CARD_CATALOG.slice(0, 5);
    const deck = createDeck(definitions, () => 0.42);
    expect(deck).toHaveLength(definitions.length * 2);

    for (const definition of definitions) {
      expect(deck.filter((card) => card.pairId === definition.pairId)).toHaveLength(2);
    }
  });

  it("adds the object's starting letter to both cards", () => {
    const deck = createDeck(CARD_CATALOG.slice(0, 2), () => 0.4);
    for (const card of deck) {
      expect(card.initial).toBe(Array.from(card.name)[0]?.toUpperCase());
    }
  });

  it("rejects duplicate pair identifiers", () => {
    const duplicate = [CARD_CATALOG[0]!, { ...CARD_CATALOG[1]!, pairId: CARD_CATALOG[0]!.pairId }];
    expect(() => createDeck(duplicate)).toThrow("unique pairId");
  });
});
