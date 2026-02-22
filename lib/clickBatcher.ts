const FLUSH_INTERVAL_MS = 3000;
const FLUSH_API_URL = "/api/clicks/flush";

const pendingClicksByUser = new Map<string, number>();

let flushIntervalId: number | null = null;
let flushInProgress = false;
let beforeUnloadAttached = false;

function hasPendingClicks(): boolean {
  for (const count of pendingClicksByUser.values()) {
    if (count > 0) {
      return true;
    }
  }

  return false;
}

function stopFlushIntervalIfIdle(): void {
  if (flushInProgress || hasPendingClicks()) {
    return;
  }

  if (flushIntervalId !== null) {
    window.clearInterval(flushIntervalId);
    flushIntervalId = null;
  }

  if (beforeUnloadAttached) {
    window.removeEventListener("beforeunload", flushOnBeforeUnload);
    beforeUnloadAttached = false;
  }
}

async function flushPendingClicks(): Promise<void> {
  if (flushInProgress) {
    return;
  }

  const usersToFlush = Array.from(pendingClicksByUser.entries()).filter(
    ([, count]) => count > 0
  );

  if (usersToFlush.length === 0) {
    stopFlushIntervalIfIdle();
    return;
  }

  flushInProgress = true;

  try {
    for (const [userId, countToFlush] of usersToFlush) {
      pendingClicksByUser.set(userId, 0);

      let response: Response;
      try {
        response = await fetch(FLUSH_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, count: countToFlush }),
        });
      } catch (e) {
        throw e;
      }

      if (!response.ok) {
        const existing = pendingClicksByUser.get(userId) ?? 0;
        pendingClicksByUser.set(userId, existing + countToFlush);
      } else {
        const stillPending = pendingClicksByUser.get(userId) ?? 0;
        if (stillPending === 0) {
          pendingClicksByUser.delete(userId);
        }
      }
    }
  } finally {
    flushInProgress = false;
    stopFlushIntervalIfIdle();
  }
}

function flushOnBeforeUnload(): void {
  for (const [userId, count] of pendingClicksByUser.entries()) {
    if (count <= 0) {
      continue;
    }

    const payload = JSON.stringify({ userId, count });
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(FLUSH_API_URL, blob);
    pendingClicksByUser.delete(userId);
  }
}

function ensureFlushLoopStarted(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!beforeUnloadAttached) {
    window.addEventListener("beforeunload", flushOnBeforeUnload);
    beforeUnloadAttached = true;
  }

  if (flushIntervalId === null) {
    flushIntervalId = window.setInterval(() => {
      void flushPendingClicks();
    }, FLUSH_INTERVAL_MS);
  }
}

export function registerClick(userId: string): void {
  if (!userId) {
    return;
  }

  const current = pendingClicksByUser.get(userId) ?? 0;
  pendingClicksByUser.set(userId, current + 1);
  ensureFlushLoopStarted();
}
