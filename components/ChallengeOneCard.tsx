"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ChallengeDefinition,
  ChallengeProgress,
  ChallengeRuntimeState,
} from "@/lib/challenges";
import { formatChallengeTime } from "@/lib/challenges";

interface ChallengeOneCardProps {
  challenge: ChallengeDefinition;
  progress: ChallengeProgress;
  onProgressChange: (
    challengeId: string,
    updater: (current: ChallengeProgress) => ChallengeProgress
  ) => void;
}

interface ArenaSize {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

const BUTTON_WIDTH = 132;
const BUTTON_HEIGHT = 56;

function getArenaPadding(width: number): number {
  return width < 420 ? 18 : 28;
}

function getRandomPosition(
  arenaSize: ArenaSize,
  previousPosition: Position | null
): Position {
  const padding = getArenaPadding(arenaSize.width);
  const minX = padding;
  const minY = padding;
  const maxX = Math.max(minX, arenaSize.width - BUTTON_WIDTH - padding);
  const maxY = Math.max(minY, arenaSize.height - BUTTON_HEIGHT - padding);
  const minTravelDistance = Math.min(
    120,
    Math.max(56, Math.min(arenaSize.width, arenaSize.height) * 0.28)
  );

  let candidate = {
    x: minX,
    y: minY,
  };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    candidate = {
      x:
        maxX <= minX ? minX : minX + Math.random() * (maxX - minX),
      y:
        maxY <= minY ? minY : minY + Math.random() * (maxY - minY),
    };

    if (previousPosition === null) {
      return candidate;
    }

    const dx = candidate.x - previousPosition.x;
    const dy = candidate.y - previousPosition.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= minTravelDistance) {
      return candidate;
    }
  }

  return candidate;
}

export default function ChallengeOneCard({
  challenge,
  progress,
  onProgressChange,
}: ChallengeOneCardProps) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const clicksRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const [runtimeState, setRuntimeState] =
    useState<ChallengeRuntimeState>("idle");
  const [currentClicks, setCurrentClicks] = useState(0);
  const [timeRemainingMs, setTimeRemainingMs] = useState(challenge.timeLimitMs);
  const [lastResultMs, setLastResultMs] = useState<number | null>(null);
  const [arenaSize, setArenaSize] = useState<ArenaSize>({ width: 0, height: 0 });
  const [buttonPosition, setButtonPosition] = useState<Position | null>(null);

  const latestProgressText = `${currentClicks} / ${challenge.targetClicks}`;
  const bestTimeLabel = formatChallengeTime(progress.bestTimeMs);

  useEffect(() => {
    clicksRef.current = currentClicks;
  }, [currentClicks]);

  useEffect(() => {
    const node = arenaRef.current;
    if (node === null) {
      return;
    }

    const updateArenaSize = () => {
      setArenaSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    updateArenaSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateArenaSize();
      });
      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", updateArenaSize);

    return () => {
      window.removeEventListener("resize", updateArenaSize);
    };
  }, []);

  useEffect(() => {
    if (runtimeState !== "playing") {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      if (startTimeRef.current === null) {
        return;
      }

      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, challenge.timeLimitMs - elapsed);
      setTimeRemainingMs(remaining);

      if (remaining <= 0) {
        setRuntimeState("lost");
        setLastResultMs(null);
        setButtonPosition(null);
        onProgressChange(challenge.id, (current) => ({
          ...current,
          lastProgress: clicksRef.current,
        }));
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [challenge.id, challenge.timeLimitMs, onProgressChange, runtimeState]);

  const timerPercent = useMemo(() => {
    return Math.max(
      0,
      Math.min(100, (timeRemainingMs / challenge.timeLimitMs) * 100)
    );
  }, [challenge.timeLimitMs, timeRemainingMs]);

  const startChallenge = () => {
    if (arenaSize.width === 0 || arenaSize.height === 0) {
      return;
    }

    const initialPosition = getRandomPosition(arenaSize, null);

    startTimeRef.current = performance.now();
    clicksRef.current = 0;
    setCurrentClicks(0);
    setTimeRemainingMs(challenge.timeLimitMs);
    setLastResultMs(null);
    setButtonPosition(initialPosition);
    setRuntimeState("playing");

    onProgressChange(challenge.id, (current) => ({
      ...current,
      attemptCount: current.attemptCount + 1,
      lastProgress: 0,
    }));
  };

  const handleTargetClick = () => {
    if (runtimeState !== "playing" || buttonPosition === null) {
      return;
    }

    const nextClicks = clicksRef.current + 1;
    clicksRef.current = nextClicks;
    setCurrentClicks(nextClicks);

    if (nextClicks >= challenge.targetClicks) {
      const elapsed = startTimeRef.current
        ? performance.now() - startTimeRef.current
        : challenge.timeLimitMs;

      setRuntimeState("won");
      setTimeRemainingMs(Math.max(0, challenge.timeLimitMs - elapsed));
      setLastResultMs(elapsed);
      setButtonPosition(null);

      onProgressChange(challenge.id, (current) => ({
        ...current,
        completed: true,
        bestTimeMs:
          current.bestTimeMs === null || elapsed < current.bestTimeMs
            ? elapsed
            : current.bestTimeMs,
        lastProgress: challenge.targetClicks,
      }));
      return;
    }

    onProgressChange(challenge.id, (current) => ({
      ...current,
      lastProgress: nextClicks,
    }));
    setButtonPosition(getRandomPosition(arenaSize, buttonPosition));
  };

  return (
    <article className="border border-border bg-card p-6 md:p-8 min-h-[560px] flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Playable Now
          </p>
          <div>
            <h2 className="font-mono text-xl text-foreground uppercase tracking-[0.12em]">
              {challenge.title}
            </h2>
            <p className="mt-2 max-w-xl font-mono text-xs leading-6 text-muted-foreground">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="rounded-full border border-[rgba(99,102,241,0.35)] bg-[rgba(99,102,241,0.12)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#818cf8]">
          Separate Mode
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border border-border/80 bg-background/60 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Goal
          </p>
          <p className="mt-2 font-mono text-sm text-foreground">
            {challenge.targetClicks} hits in {challenge.timeLimitMs / 1000}s
          </p>
        </div>
        <div className="border border-border/80 bg-background/60 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Best Time
          </p>
          <p className="mt-2 font-mono text-sm text-foreground">{bestTimeLabel}</p>
        </div>
        <div className="border border-border/80 bg-background/60 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Attempts
          </p>
          <p className="mt-2 font-mono text-sm text-foreground">
            {progress.attemptCount}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.18em]">
          <span className="text-muted-foreground">Progress {latestProgressText}</span>
          <span
            className={cn(
              "transition-colors",
              runtimeState === "playing" ? "text-[#818cf8]" : "text-muted-foreground"
            )}
          >
            {Math.max(0, timeRemainingMs / 1000).toFixed(2)}s left
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <div
            className={cn(
              "h-full rounded-full transition-[width,background-color] duration-150",
              runtimeState === "lost" ? "bg-[#ef4444]" : "bg-[#6366f1]"
            )}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </div>

      <div
        ref={arenaRef}
        className="relative min-h-[320px] overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_55%),linear-gradient(180deg,rgba(18,18,24,0.98),rgba(10,10,10,0.98))]"
      >
        {runtimeState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-foreground">
              Ready?
            </p>
            <p className="mt-4 max-w-sm font-mono text-xs leading-6 text-muted-foreground">
              Tap start, then chase the button as it jumps around the arena.
              Finish all 10 hits before the timer empties.
            </p>
          </div>
        )}

        {runtimeState === "won" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-[#4ade80]">
              Challenge Complete
            </p>
            <p className="mt-4 font-mono text-xs leading-6 text-muted-foreground">
              Cleared in {formatChallengeTime(lastResultMs)}.{" "}
              {progress.bestTimeMs !== null && lastResultMs !== null && lastResultMs <= progress.bestTimeMs
                ? "New best time."
                : "Try again to go even faster."}
            </p>
          </div>
        )}

        {runtimeState === "lost" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-sm uppercase tracking-[0.24em] text-[#f87171]">
              Time&apos;s Up
            </p>
            <p className="mt-4 font-mono text-xs leading-6 text-muted-foreground">
              You reached {currentClicks} of {challenge.targetClicks}. Hit retry
              and take another run.
            </p>
          </div>
        )}

        {runtimeState === "playing" && buttonPosition !== null && (
          <button
            type="button"
            onClick={handleTargetClick}
            className="absolute h-14 w-[132px] rounded-[4px] bg-[#6366f1] font-mono text-xs uppercase tracking-[0.2em] text-white shadow-[0_0_32px_rgba(99,102,241,0.28)] transition-[transform,left,top,background-color] duration-150 ease-out hover:bg-[#7376ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5b4fc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f13]"
            style={{
              left: `${buttonPosition.x}px`,
              top: `${buttonPosition.y}px`,
            }}
          >
            Catch Me
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {progress.completed
            ? "Completed locally in this browser"
            : `Last progress ${progress.lastProgress}/${challenge.targetClicks}`}
        </div>

        {runtimeState === "playing" ? (
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#818cf8]">
            Move fast. The button jumps after every hit.
          </div>
        ) : (
          <button
            type="button"
            onClick={startChallenge}
            className="bg-primary px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground transition-all hover:brightness-110 active:brightness-90"
          >
            {runtimeState === "idle"
              ? "Start Challenge"
              : runtimeState === "won"
                ? "Play Again"
                : "Try Again"}
          </button>
        )}
      </div>
    </article>
  );
}
