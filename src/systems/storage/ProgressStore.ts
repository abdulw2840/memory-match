const STORAGE_KEY = "memory-match.progress.v1";

export interface ProgressData {
  readonly completedLevels: readonly number[];
  readonly bestMoves: Readonly<Record<string, number>>;
  readonly bestTimes: Readonly<Record<string, number>>;
  readonly selectedAvatar: string;
}

const EMPTY_PROGRESS: ProgressData = {
  completedLevels: [],
  bestMoves: {},
  bestTimes: {},
  selectedAvatar: "sunny",
};

export class ProgressStore {
  public load(): ProgressData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_PROGRESS;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return EMPTY_PROGRESS;
      const value = parsed as Partial<ProgressData>;
      return {
        completedLevels: Array.isArray(value.completedLevels)
          ? value.completedLevels.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 12)
          : [],
        bestMoves: value.bestMoves && typeof value.bestMoves === "object" ? value.bestMoves : {},
        bestTimes: value.bestTimes && typeof value.bestTimes === "object" ? value.bestTimes : {},
        selectedAvatar: typeof value.selectedAvatar === "string" ? value.selectedAvatar : "sunny",
      };
    } catch {
      return EMPTY_PROGRESS;
    }
  }

  public save(progress: ProgressData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Private browsing or storage restrictions should not prevent playing.
    }
  }
}
