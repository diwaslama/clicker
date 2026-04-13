"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChallengeOneCard from "@/components/ChallengeOneCard";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import {
  challengeDefinitions,
  createDefaultChallengeProgressMap,
  loadChallengeProgressMap,
  saveChallengeProgressMap,
  type ChallengeProgress,
  type ChallengeProgressMap,
} from "@/lib/challenges";

interface LocationResponse {
  allowed: boolean;
  city: string | null;
}

function ChallengeContent({ city }: { city: string }) {
  const { displayName, isLoading } = useAnonymousSession({ city });
  const [progressMap, setProgressMap] = useState<ChallengeProgressMap>(() =>
    createDefaultChallengeProgressMap()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgressMap(loadChallengeProgressMap());
      setIsHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const updateProgress = (
    challengeId: string,
    updater: (current: ChallengeProgress) => ChallengeProgress
  ) => {
    setProgressMap((current) => {
      const next = {
        ...current,
        [challengeId]: updater(current[challengeId]),
      };
      saveChallengeProgressMap(next);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.07) 0%, transparent 58%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col gap-6 border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Puzzle Mode
              </p>
              <div>
                <h1 className="font-mono text-2xl md:text-3xl uppercase tracking-[0.14em] text-foreground">
                  Challenges
                </h1>
                <p className="mt-3 max-w-2xl font-mono text-xs leading-6 text-muted-foreground">
                  Side quests for your clicking reflexes. These runs are tracked
                  separately from the leaderboard, and your best times stay in
                  this browser.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <Link
                href="/"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Back to Clicker
              </Link>
              <div className="border border-border/80 bg-background/70 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Player
                </p>
                <p className="mt-2 font-mono text-xs text-foreground">
                  {isLoading ? "Loading..." : displayName ?? "Anonymous"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-border/80 bg-background/60 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Progress Saved
              </p>
              <p className="mt-2 font-mono text-xs leading-6 text-foreground">
                Browser local storage
              </p>
            </div>
            <div className="border border-border/80 bg-background/60 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Challenge Count
              </p>
              <p className="mt-2 font-mono text-xs leading-6 text-foreground">
                {challengeDefinitions.filter((item) => item.status === "available").length} live now
              </p>
            </div>
            <div className="border border-border/80 bg-background/60 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Main Counter
              </p>
              <p className="mt-2 font-mono text-xs leading-6 text-foreground">
                Unchanged by challenge attempts
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          {challengeDefinitions.map((challenge) => {
            if (challenge.status === "available") {
              return (
                <ChallengeOneCard
                  key={challenge.id}
                  challenge={challenge}
                  progress={progressMap[challenge.id]}
                  onProgressChange={updateProgress}
                />
              );
            }

            return (
              <article
                key={challenge.id}
                className="border border-dashed border-border bg-card/60 p-6 md:p-8 opacity-75"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Coming Soon
                    </p>
                    <h2 className="mt-3 font-mono text-xl uppercase tracking-[0.12em] text-foreground">
                      {challenge.title}
                    </h2>
                    <p className="mt-3 max-w-xl font-mono text-xs leading-6 text-muted-foreground">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Locked
                  </div>
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  More puzzle runs will land here next.
                </p>
              </article>
            );
          })}
        </div>

        {!isHydrated && (
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Loading saved challenge progress...
          </p>
        )}
      </div>
    </main>
  );
}

export default function ChallengesPage() {
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const checkLocation = async () => {
      try {
        const response = await fetch("/api/location");
        const data = (await response.json()) as LocationResponse;

        if (isCancelled) {
          return;
        }

        setIsAllowed(data.allowed === true);
        setCity(data.allowed === true ? data.city ?? "Brisbane" : null);
      } catch {
        if (isCancelled) {
          return;
        }

        setIsAllowed(false);
        setCity(null);
      } finally {
        if (!isCancelled) {
          setIsLocationLoading(false);
        }
      }
    };

    void checkLocation();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLocationLoading) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl text-slate-100">
            🌏 Brisbane Clicker is only available in Queensland, Australia
          </p>
          <p className="mt-3 text-sm text-slate-400">Come visit us sometime 👋</p>
        </div>
      </div>
    );
  }

  return <ChallengeContent city={city ?? "Brisbane"} />;
}
