"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ClaimAccount from "@/components/ClaimAccount";
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

function AppContent({ city }: { city: string }) {
  const { userId, displayName: hookDisplayName, isAnonymous, isLoading, markAsClaimed } = useAnonymousSession({
    city,
  });
  // EXISTING CODE
  const { count, updateCount, reset } = useSyncCounter();
  const [displayName, setDisplayName] = useState<string | null>(hookDisplayName);
  const visibleDisplayName = displayName ?? hookDisplayName;

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 p-6 md:p-10">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 h-[540px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/35 via-violet-500/25 to-purple-600/35 blur-[140px]" />
        <div className="absolute top-16 right-10 h-[280px] w-[280px] rounded-full bg-indigo-500/20 blur-[95px]" />
        <div className="absolute bottom-10 left-10 h-[260px] w-[260px] rounded-full bg-violet-500/20 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          <Card className="border-white/20 bg-white/[0.07] backdrop-blur-2xl shadow-2xl shadow-black/40">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Brisbane Clicker
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-purple-600/20 blur-2xl" />
                </div>
                <motion.div
                  key={count}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="relative flex min-h-[120px] flex-col items-center justify-center"
                >
                  <span className="text-6xl font-bold tabular-nums bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent drop-shadow-lg">
                    {count}
                  </span>
                  <span className="mt-2 text-xs tracking-wide text-slate-400">
                    Playing as {visibleDisplayName ?? "Anonymous"}
                  </span>
                  {isAnonymous === false && (
                    <SetDisplayName
                      userId={userId}
                      displayName={visibleDisplayName}
                      onDisplayNameChange={setDisplayName}
                    />
                  )}
                </motion.div>
              </div>

              <div className="flex justify-center">
                <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.02 }}>
                  <Button onClick={increment} size="lg" className="min-w-[140px]">
                    Increment
                  </Button>
                </motion.div>
              </div>
            </CardContent>

            <CardFooter className="flex-col justify-center gap-3 pt-2 pb-6">
              <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.02 }}>
                <Button onClick={handleReset} variant="destructive" size="lg">
                  Reset
                </Button>
              </motion.div>
              {isAnonymous === true && <ClaimAccount markAsClaimed={markAsClaimed} />}
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          className="w-full"
        >
          <Leaderboard city={city} currentUserId={userId} />
          {userId !== null && !userId.startsWith("local-") && (
            <YourRank userId={userId} city={city} />
          )}
        </motion.div>
      </div>
    </div>
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
