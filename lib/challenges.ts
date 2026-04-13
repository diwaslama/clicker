export type ChallengeStatus = "available" | "coming-soon";

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  targetClicks: number;
  timeLimitMs: number;
  status: ChallengeStatus;
}

export interface ChallengeProgress {
  completed: boolean;
  bestTimeMs: number | null;
  attemptCount: number;
  lastProgress: number;
}

export type ChallengeRuntimeState = "idle" | "playing" | "won" | "lost";

export type ChallengeProgressMap = Record<string, ChallengeProgress>;

export const CHALLENGE_STORAGE_KEY = "clicker-challenges-v1";

export const challengeDefinitions: ChallengeDefinition[] = [
  {
    id: "challenge-1",
    title: "Challenge 1",
    description: "Hit the moving button 10 times in 8 seconds.",
    targetClicks: 10,
    timeLimitMs: 8000,
    status: "available",
  },
  {
    id: "challenge-2",
    title: "Challenge 2",
    description: "A trickier puzzle is lining up next.",
    targetClicks: 0,
    timeLimitMs: 0,
    status: "coming-soon",
  },
  {
    id: "challenge-3",
    title: "Challenge 3",
    description: "More click chaos is coming soon.",
    targetClicks: 0,
    timeLimitMs: 0,
    status: "coming-soon",
  },
];

export function createEmptyChallengeProgress(): ChallengeProgress {
  return {
    completed: false,
    bestTimeMs: null,
    attemptCount: 0,
    lastProgress: 0,
  };
}

export function createDefaultChallengeProgressMap(): ChallengeProgressMap {
  return Object.fromEntries(
    challengeDefinitions.map((challenge) => [
      challenge.id,
      createEmptyChallengeProgress(),
    ])
  );
}

export function loadChallengeProgressMap(): ChallengeProgressMap {
  const fallback = createDefaultChallengeProgressMap();

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (raw === null) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<ChallengeProgressMap>;
    const merged = { ...fallback };

    for (const challenge of challengeDefinitions) {
      const value = parsed[challenge.id];
      if (
        value &&
        typeof value === "object" &&
        typeof value.completed === "boolean" &&
        (value.bestTimeMs === null || typeof value.bestTimeMs === "number") &&
        typeof value.attemptCount === "number" &&
        typeof value.lastProgress === "number"
      ) {
        merged[challenge.id] = {
          completed: value.completed,
          bestTimeMs: value.bestTimeMs,
          attemptCount: value.attemptCount,
          lastProgress: value.lastProgress,
        };
      }
    }

    return merged;
  } catch {
    return fallback;
  }
}

export function saveChallengeProgressMap(progressMap: ChallengeProgressMap): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CHALLENGE_STORAGE_KEY,
    JSON.stringify(progressMap)
  );
}

export function formatChallengeTime(timeMs: number | null): string {
  if (timeMs === null) {
    return "--";
  }

  return `${(timeMs / 1000).toFixed(2)}s`;
}
