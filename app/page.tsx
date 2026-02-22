"use client";

import { useEffect, useRef, useState } from "react";
import ClaimAccount from "@/components/ClaimAccount";
import DeleteAccount from "@/components/DeleteAccount";
import Leaderboard from "@/components/Leaderboard";
import SetDisplayName from "@/components/SetDisplayName";
import YourRank from "@/components/YourRank";
import { useAnonymousSession } from "@/hooks/useAnonymousSession";
import { registerClick } from "@/lib/clickBatcher";
import { useSyncCounter } from "@/hooks/useSyncCounter";

interface LocationResponse {
  allowed: boolean;
  city: string | null;
}

interface RankSeedResponse {
  totalClicks: number;
}

function AppContent({ city }: { city: string }) {
  const { userId, displayName: hookDisplayName, isAnonymous, isLoading, markAsClaimed } = useAnonymousSession({
    city,
  });
  // EXISTING CODE
  const { count, updateCount, reset } = useSyncCounter();
  const [displayName, setDisplayName] = useState<string | null>(hookDisplayName);
  const visibleDisplayName = displayName ?? hookDisplayName;
  const hasSeededInitialCountRef = useRef(false);

  if (isLoading) {
    // render no additional UI while session bootstrap is in progress
  }

  const increment = () => {
    // EXISTING CODE
    updateCount(count + 1);
    if (userId !== null && !userId.startsWith("local-")) {
      registerClick(userId);
    }
  };

  const handleReset = () => {
    reset();

    if (userId !== null && !userId.startsWith("local-")) {
      void fetch("/api/session/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    }
  };

  useEffect(() => {
    if (hasSeededInitialCountRef.current || isLoading) {
      return;
    }

    if (userId === null || userId.startsWith("local-")) {
      hasSeededInitialCountRef.current = true;
      return;
    }

    hasSeededInitialCountRef.current = true;
    let isCancelled = false;

    const seedInitialCountFromDb = async () => {
      try {
        const params = new URLSearchParams({ userId, city });
        const response = await fetch(`/api/rank?${params.toString()}`);
        if (!response.ok || isCancelled) {
          return;
        }

        const data = (await response.json()) as RankSeedResponse;
        if (typeof data.totalClicks === "number" && Number.isFinite(data.totalClicks)) {
          updateCount(Math.max(0, Math.trunc(data.totalClicks)));
        }
      } catch {
        // Keep local counter value if rank fetch fails.
      }
    };

    void seedInitialCountFromDb();

    return () => {
      isCancelled = true;
    };
  }, [city, isLoading, updateCount, userId]);

  return (
    <main className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-20">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {isAnonymous === false && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Set Name
                </span>
                <SetDisplayName
                  userId={userId}
                  displayName={visibleDisplayName}
                  onDisplayNameChange={setDisplayName}
                />
              </>
            )}
            <DeleteAccount userId={userId} />
          </div>
          {isAnonymous === true && <ClaimAccount markAsClaimed={markAsClaimed} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-between border border-border bg-card p-8 md:p-12 min-h-[400px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Brisbane Clicker
              </p>

              <div className="flex flex-col items-center gap-3">
                <span className="font-mono text-7xl md:text-8xl lg:text-9xl font-light text-foreground tabular-nums leading-none">
                  {count.toLocaleString()}
                </span>
                <p className="font-mono text-xs text-muted-foreground">
                  {"Playing as "}
                  {visibleDisplayName ?? "Anonymous"}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <button
                  onClick={increment}
                  className="w-full bg-primary text-primary-foreground font-mono text-sm uppercase tracking-[0.2em] py-4 rounded-[4px] hover:brightness-110 active:brightness-90 transition-all cursor-pointer"
                >
                  Click
                </button>
                <button
                  onClick={handleReset}
                  className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
                >
                  Reset
                </button>
              </div>
            </div>

            {userId !== null && !userId.startsWith("local-") && (
              <YourRank userId={userId} city={city} />
            )}
          </div>

          <Leaderboard city={city} currentUserId={userId} />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
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
          <p className="text-2xl text-slate-100">🌏 Brisbane Clicker is only available in Queensland, Australia</p>
          <p className="mt-3 text-sm text-slate-400">Come visit us sometime 👋</p>
        </div>
      </div>
    );
  }

  return <AppContent city={city ?? "Brisbane"} />;
}
