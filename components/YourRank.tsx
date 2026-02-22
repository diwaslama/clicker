"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./YourRank.module.css";

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
    void fetchRank();

    const intervalId = window.setInterval(() => {
      void fetchRank();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchRank]);

  let message = "Loading rank...";
  let messageClassName = `${styles.message} ${styles.loading}`;

  if (data !== null) {
    messageClassName = styles.message;

    if (data.rank === 1) {
      message = "You are #1";
    } else if (data.totalClicks === 0) {
      message = "Start clicking to join the leaderboard";
    } else if (data.clicksToClimb !== null) {
      const nextRank = data.rank - 1;
      message = `${data.clicksToClimb.toLocaleString()} clicks to climb to #${nextRank}`;
    } else {
      message = "";
    }
  }

  return (
    <section className={styles.panel}>
      <p className={styles.label}>YOUR RANK</p>
      <p className={styles.rank}>{data === null ? "#" : `#${data.rank.toLocaleString()}`}</p>
      <p className={messageClassName}>{message}</p>
    </section>
  );
}
