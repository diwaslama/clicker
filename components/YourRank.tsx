"use client";

import { useCallback, useEffect, useState } from "react";

interface YourRankProps {
  userId: string;
  city: string;
}

interface RankResponse {
  rank: number;
  totalClicks: number;
  nextRankClicks: number | null;
  clicksToClimb: number | null;
}

const REFRESH_INTERVAL_MS = 5000;

export default function YourRank({ userId, city }: YourRankProps) {
  const [data, setData] = useState<RankResponse | null>(null);

  const fetchRank = useCallback(async () => {
    try {
      const params = new URLSearchParams({ userId, city });
      const response = await fetch(`/api/rank?${params.toString()}`);
      if (!response.ok) {
        return;
      }

      const nextData = (await response.json()) as RankResponse;
      setData(nextData);
    } catch {
      // Ignore intermittent request failures and retry on next interval.
    }
  }, [city, userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRank();
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchRank();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchRank]);

  const rank = data?.rank ?? null;
  const isInTopTen =
    data !== null && data.totalClicks > 0 && data.rank <= 10;
  const nextRankPosition = data !== null ? data.rank - 1 : null;
  const clicksToNextRank = data?.clicksToClimb ?? null;

  let detailMessage = "Loading rank...";
  if (data !== null) {
    if (data.rank === 1) {
      detailMessage = "You are #1";
    } else if (data.totalClicks === 0) {
      detailMessage = "Start clicking to join the leaderboard";
    } else if (isInTopTen) {
      detailMessage = "You are in the top 10";
    } else if (clicksToNextRank !== null && nextRankPosition !== null) {
      detailMessage = `${clicksToNextRank.toLocaleString()} clicks to climb to #${nextRankPosition}`;
    } else {
      detailMessage = "Keep clicking";
    }
  }

  return (
    <div className="border border-border bg-card p-8">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
        Your Rank
      </p>

      {rank !== null ? (
        <>
          <p className="font-mono text-4xl md:text-5xl font-light text-foreground mt-4 leading-none">
            {"#"}
            {rank}
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            {detailMessage}
          </p>
        </>
      ) : (
        <>
          <p className="font-mono text-4xl md:text-5xl font-light text-muted-foreground/30 mt-4 leading-none">
            --
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            Save your score to see your rank
          </p>
        </>
      )}
    </div>
  );
}
